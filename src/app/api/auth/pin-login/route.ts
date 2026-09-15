import { NextRequest, NextResponse } from 'next/server';
import { validatePin, validateCustomerMobileNumber, validateDeliveryBoyId, verifyPin } from '@/lib/security';
import { getAdminClient } from '@/lib/supabase/admin';
import { dataService } from '@/lib/data-service';
import { UserRole } from '@/lib/types';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const { mode, loginId, pin } = body;

    // 1. Basic format validation
    if (mode !== 'customer' && mode !== 'delivery_boy') {
      return NextResponse.json(
        { error: 'Invalid authentication mode specified.' },
        { status: 400 }
      );
    }

    const pinCheck = validatePin(pin);
    if (!pinCheck.valid) {
      return NextResponse.json(
        { error: pinCheck.error || 'Password must contain exactly 4 digits.' },
        { status: 400 }
      );
    }

    let normalizedLoginId = '';
    if (mode === 'customer') {
      const idCheck = validateCustomerMobileNumber(loginId);
      if (!idCheck.valid) {
        return NextResponse.json(
          { error: idCheck.error || 'Enter a valid 10-digit mobile number.' },
          { status: 400 }
        );
      }
      normalizedLoginId = idCheck.normalized!;
    } else {
      const dboyCheck = validateDeliveryBoyId(loginId);
      if (!dboyCheck.valid) {
        return NextResponse.json(
          { error: dboyCheck.error || 'Delivery Staff ID must be in format D followed by 3 digits (e.g. D001).' },
          { status: 400 }
        );
      }
      normalizedLoginId = dboyCheck.normalized!;
    }

    // 2. Fetch account & verify
    const adminSupabase = getAdminClient();
    let account: any = null;
    let isLiveDatabase = false;

    if (adminSupabase) {
      if (mode === 'customer') {
        const { data, error } = await adminSupabase
          .from('customers')
          .select('id, name, phone, login_id, pin_hash, login_enabled, failed_login_attempts, locked_until, profile_id, status')
          .or(`login_id.eq.${normalizedLoginId},login_id.eq.91${normalizedLoginId},phone.ilike.%${normalizedLoginId}%`)
          .maybeSingle();

        if (!error && data) {
          account = data;
          isLiveDatabase = true;
        }
      } else {
        const { data, error } = await adminSupabase
          .from('delivery_boys')
          .select('id, name, phone, login_id, pin_hash, login_enabled, failed_login_attempts, locked_until, profile_id')
          .ilike('login_id', normalizedLoginId)
          .maybeSingle();

        if (!error && data) {
          account = data;
          isLiveDatabase = true;
        }
      }
    }

    // Fallback to in-memory store if database row not found or client offline
    if (!account) {
      if (mode === 'customer') {
        account = dataService.getCustomerByLoginId(normalizedLoginId);
      } else {
        account = dataService.getDeliveryBoyByLoginId(normalizedLoginId);
      }
    }

    // 3. Check Lockout Status
    if (account?.locked_until) {
      const lockDate = new Date(account.locked_until);
      if (lockDate.getTime() > Date.now()) {
        const remainingMinutes = Math.ceil((lockDate.getTime() - Date.now()) / (60 * 1000));
        return NextResponse.json(
          {
            error: `Account is temporarily locked due to repeated failed attempts. Please try again in ${remainingMinutes} minute(s) or contact Admin.`,
          },
          { status: 429 }
        );
      }
    }

    // 4. Check Inactive / Disabled Status
    if (account && (account.login_enabled === false || (mode === 'customer' && account.status === 'CANCELLED'))) {
      return NextResponse.json(
        { error: 'Your account is currently inactive. Please contact the Admin.' },
        { status: 403 }
      );
    }

    // 5. Verify PIN (constant-time check executes even if account does not exist)
    const isValid = verifyPin(pin, account?.pin_hash);

    if (!isValid || !account) {
      // Record failure if account exists
      if (account) {
        if (isLiveDatabase && adminSupabase) {
          const fails = (account.failed_login_attempts || 0) + 1;
          const lockedUntil = fails >= 5 ? new Date(Date.now() + 15 * 60 * 1000).toISOString() : null;
          const tableName = mode === 'customer' ? 'customers' : 'delivery_boys';
          await adminSupabase
            .from(tableName)
            .update({
              failed_login_attempts: fails,
              locked_until: lockedUntil,
            })
            .eq('id', account.id);
        } else {
          if (mode === 'customer') {
            dataService.recordFailedCustomerLogin(account.id);
          } else {
            dataService.recordFailedDeliveryBoyLogin(account.id);
          }
        }
      }

      // Generic error message: never leak whether Login ID exists
      return NextResponse.json(
        { error: mode === 'customer' ? 'Invalid mobile number or password.' : 'Invalid Login ID or PIN.' },
        { status: 401 }
      );
    }

    // 6. Reset failed attempts upon successful login
    if (isLiveDatabase && adminSupabase) {
      const tableName = mode === 'customer' ? 'customers' : 'delivery_boys';
      await adminSupabase
        .from(tableName)
        .update({
          failed_login_attempts: 0,
          locked_until: null,
        })
        .eq('id', account.id);
    } else {
      if (mode === 'customer') {
        dataService.resetCustomerFailedAttempts(account.id);
      } else {
        dataService.resetDeliveryBoyFailedAttempts(account.id);
      }
    }

    // 7. Establish authenticated session
    const role: UserRole = mode === 'customer' ? 'CUSTOMER' : 'DELIVERY_BOY';
    const userId = account.profile_id || account.id;
    const authUser = {
      id: userId,
      email: `${normalizedLoginId.toLowerCase()}@papertrack.com`,
      fullName: account.name,
      role,
      customerId: mode === 'customer' ? account.id : undefined,
      deliveryBoyId: mode === 'delivery_boy' ? account.id : undefined,
    };

    const response = NextResponse.json({
      success: true,
      role,
      user: authUser,
    });

    // Set secure authentication cookies
    const cookieOptions = {
      path: '/',
      httpOnly: false, // Accessible to client-side auth context
      sameSite: 'lax' as const,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 60 * 60 * 24 * 7, // 7 days
    };

    response.cookies.set('papertrack_role', role, cookieOptions);
    response.cookies.set('papertrack_user_id', userId, cookieOptions);
    response.cookies.set('papertrack_session', JSON.stringify(authUser), cookieOptions);

    return response;
  } catch (err: any) {
    return NextResponse.json(
      { error: 'Unable to sign in right now. Please try again.' },
      { status: 500 }
    );
  }
}
