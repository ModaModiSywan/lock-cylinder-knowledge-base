export const prerender = false;

import type { APIRoute } from 'astro';
import { supabase } from '../../lib/supabase';
import { Resend } from 'resend';

// 目标接收询盘邮箱
const TARGET_ADMIN_EMAIL = 'xuyilock@gmail.com';

// 初始化 Resend 客户端
const resendApiKey = import.meta.env.RESEND_API_KEY || process.env.RESEND_API_KEY;
const resend = resendApiKey ? new Resend(resendApiKey) : null;

interface InquiryPayload {
  name: string;
  email: string;
  company?: string;
  phone?: string;
  country?: string;
  product_name?: string;
  product_slug?: string;
  quantity?: string | number;
  message: string;
  specs_data?: Record<string, any>;
  honeypot?: string; // 隐藏蜜罐字段
}

export const POST: APIRoute = async ({ request, clientAddress }) => {
  try {
    let payload: InquiryPayload;

    const contentType = request.headers.get('content-type') || '';

    // 1. 兼容解析 JSON 与 FormData
    if (contentType.includes('application/json')) {
      payload = await request.json();
    } else if (
      contentType.includes('application/x-www-form-urlencoded') ||
      contentType.includes('multipart/form-data')
    ) {
      const formData = await request.formData();
      payload = {
        name: formData.get('name')?.toString() || '',
        email: formData.get('email')?.toString() || '',
        company: formData.get('company')?.toString() || '',
        phone: formData.get('phone')?.toString() || '',
        country: formData.get('country')?.toString() || '',
        product_name: formData.get('product_name')?.toString() || '',
        product_slug: formData.get('product_slug')?.toString() || '',
        quantity: formData.get('quantity')?.toString() || '',
        message: formData.get('message')?.toString() || '',
        honeypot: formData.get('website_hp')?.toString() || '',
      };
    } else {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Unsupported Content-Type',
        }),
        { status: 415, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // 2. Honeypot 机器人拦截（如果蜜罐字段被填写，静默返回成功但不入库发信）
    if (payload.honeypot && payload.honeypot.trim().length > 0) {
      return new Response(
        JSON.stringify({
          success: true,
          message: 'Inquiry received successfully.',
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // 3. 基础字段验证
    const name = payload.name?.trim();
    const email = payload.email?.trim();
    const message = payload.message?.trim();

    if (!name || !email || !message) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Missing required fields: name, email, and message are mandatory.',
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // 简易邮箱格式检查
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Invalid email address format.',
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // 4. 获取客户端环境信息
    const userAgent = request.headers.get('user-agent') || 'Unknown';
    const referer = request.headers.get('referer') || '';
    const ip = clientAddress || request.headers.get('x-forwarded-for') || 'Unknown';

    // 5. 写入 Supabase inquiries 表（持久化存储）
    const { error: dbError } = await supabase
      .from('inquiries')
      .insert([
        {
          name,
          email,
          company: payload.company?.trim() || null,
          phone: payload.phone?.trim() || null,
          country: payload.country?.trim() || null,
          product_name: payload.product_name?.trim() || null,
          product_slug: payload.product_slug?.trim() || null,
          quantity: payload.quantity ? String(payload.quantity).trim() : null,
          message,
          specs_data: payload.specs_data || {},
          source_url: referer,
          ip_address: ip,
          user_agent: userAgent,
          status: 'new',
        },
      ]);

    if (dbError) {
      console.error('[Supabase Inquiry Error]:', dbError);
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Failed to record inquiry into database.',
        }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // 6. 自动发送邮件通知至 xuyilock@gmail.com
    if (resend) {
      try {
        await resend.emails.send({
          from: 'Lock Cylinder Inquiries <inquiry@xuyilock.com>',
          to: [TARGET_ADMIN_EMAIL],
          replyTo: email, // 管理员在 Gmail 中点击回复可直接回复客户
          subject: `[New Inquiry] ${name} (${payload.country || 'Global'}) - ${payload.product_name || 'General Inquiry'}`,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 620px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px; background: #ffffff;">
              <h2 style="color: #0f172a; margin-top: 0; border-bottom: 2px solid #2563eb; padding-bottom: 10px; font-size: 1.25rem;">
                New B2B Lock Cylinder Technical Inquiry
              </h2>
              
              <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px; font-size: 14px;">
                <tr>
                  <td style="padding: 8px 0; font-weight: bold; width: 140px; color: #475569;">Customer Name:</td>
                  <td style="padding: 8px 0; color: #0f172a;">${name}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; font-weight: bold; color: #475569;">Customer Email:</td>
                  <td style="padding: 8px 0; color: #0f172a;"><a href="mailto:${email}" style="color: #2563eb; font-weight: 600;">${email}</a></td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; font-weight: bold; color: #475569;">Country / Region:</td>
                  <td style="padding: 8px 0; color: #0f172a;">${payload.country || 'Not specified'}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; font-weight: bold; color: #475569;">Inquiry Product:</td>
                  <td style="padding: 8px 0; color: #0f172a;">${payload.product_name ? `${payload.product_name}` : 'General Factory Inquiry'}</td>
                </tr>
              </table>

              <div style="background: #f8fafc; border-left: 4px solid #2563eb; padding: 15px; border-radius: 0 6px 6px 0; margin-bottom: 20px;">
                <p style="margin: 0 0 8px 0; font-weight: bold; color: #334155; font-size: 13px;">Project Details / Message:</p>
                <div style="color: #0f172a; line-height: 1.6; white-space: pre-wrap; font-size: 14px;">${message}</div>
              </div>

              <div style="font-size: 12px; color: #94a3b8; border-top: 1px solid #f1f5f9; padding-top: 12px; line-height: 1.5;">
                <p style="margin: 3px 0;">Source Page: <a href="${referer}" style="color: #94a3b8;">${referer}</a></p>
                <p style="margin: 3px 0;">IP Address: ${ip}</p>
                <p style="margin: 3px 0;">Knowledge Base: <a href="https://knowledgebase.xuyilock.com" style="color: #2563eb;">knowledgebase.xuyilock.com</a></p>
              </div>
            </div>
          `,
        });
      } catch (emailErr) {
        console.error('[Resend Email Notification Failed]:', emailErr);
      }
    }

    // 7. 返回成功响应
    return new Response(
      JSON.stringify({
        success: true,
        message: 'Your inquiry has been submitted successfully.',
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (err: any) {
    console.error('[Inquiry API Internal Error]:', err);
    return new Response(
      JSON.stringify({
        success: false,
        error: 'An unexpected server error occurred.',
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};