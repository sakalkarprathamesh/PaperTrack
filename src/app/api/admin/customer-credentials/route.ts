import { NextRequest, NextResponse } from 'next/server';
import { validatePin, hashPin } from '@/lib/security';
import { getAdminClient } from '@/lib/supabase/admin';
import { dataService } from '@/lib/data-service';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const { customerId, newPin } = body;

    if (!customerId) {
      return NextResponse.json(
        { error: 'Customer ID is required.' },
        { status: 400 }
      );
    }

    const pinCheck = validatePin(newPin);
    if (!pinCheck.valid) {
      return NextResponse.json(
        { error: pinCheck.error || 'Password must contain exactly 4 digits.' },
        { status: 400 }
      );
    }

    const hashedPin = hashPin(newPin);
    const nowIso = new Date().toISOString();
    const adminSupabase = getAdminClient();

    if (adminSupabase) {
      const { error: updateError } = await adminSupabase
        .from('customers')
        .update({
          pin_hash: hashedPin,
          pin_updated_at: nowIso,
          failed_login_attempts: 0,
          locked_until: null,
        })
        .eq('id', customerId);

      if (updateError) {
        console.error('Supabase password reset error:', updateError);
        return NextResponse.json(
          { error: 'Failed to update customer password in database.' },
          { status: 500 }
        );
      }

      // Record audit log without storing plaintext password
      await adminSupabase.from('audit_logs').insert({
        entity_type: 'CUSTOMER',
        entity_id: customerId,
        action: 'RESET_PASSWORD',
        details: {
          method: 'ADMIN_MANUAL_RESET',
          reason: 'Admin reset 4-digit customer password',
          timestamp: nowIso,
        },
      });
    }

    // Keep dataService in sync
    try {
      dataService.updateCustomer(customerId, {
        pin_hash: hashedPin,
        pin_updated_at: nowIso,
        failed_login_attempts: 0,
        locked_until: null,
      });
    } catch (localErr) {
      // Local sync fallback
    }

    return NextResponse.json({
      success: true,
      message: 'Password successfully reset.',
      pin_updated_at: nowIso,
    });
  } catch (err: any) {
    console.error('Customer credential reset exception:', err);
    return NextResponse.json(
      { error: 'Unable to reset customer credentials at this time.' },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const { customerId, loginEnabled } = body;

    if (!customerId || loginEnabled === undefined) {
      return NextResponse.json(
        { error: 'Customer ID and loginEnabled boolean status are required.' },
        { status: 400 }
      );
    }

    const isEnabled = Boolean(loginEnabled);
    const nowIso = new Date().toISOString();
    const adminSupabase = getAdminClient();

    if (adminSupabase) {
      const updateData: any = {
        login_enabled: isEnabled,
      };
      if (isEnabled) {
        updateData.failed_login_attempts = 0;
        updateData.locked_until = null;
      }

      const { error: updateError } = await adminSupabase
        .from('customers')
        .update(updateData)
        .eq('id', customerId);

      if (updateError) {
        console.error('Supabase login_enabled update error:', updateError);
        return NextResponse.json(
          { error: 'Failed to update login status in database.' },
          { status: 500 }
        );
      }

      // Record audit log
      await adminSupabase.from('audit_logs').insert({
        entity_type: 'CUSTOMER',
        entity_id: customerId,
        action: isEnabled ? 'ENABLE_LOGIN' : 'DISABLE_LOGIN',
        details: {
          login_enabled: isEnabled,
          timestamp: nowIso,
        },
      });
    }

    // Keep dataService in sync
    try {
      dataService.updateCustomer(customerId, {
        login_enabled: isEnabled,
        ...(isEnabled ? { failed_login_attempts: 0, locked_until: null } : {}),
      });
    } catch (localErr) {
      // Local sync fallback
    }

    return NextResponse.json({
      success: true,
      login_enabled: isEnabled,
      message: `Customer login has been ${isEnabled ? 'enabled' : 'disabled'}.`,
    });
  } catch (err: any) {
    console.error('Customer login status toggle exception:', err);
    return NextResponse.json(
      { error: 'Unable to update login status at this time.' },
      { status: 500 }
    );
  }
}
