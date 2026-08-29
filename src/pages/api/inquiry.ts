export const prerender = false;

import type { APIRoute } from 'astro';
import { supabase } from '../../lib/supabase';

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
  honeypot?: string; // 隐藏蜜罐字段，用于防御自动化机器人
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

    // 2. Honeypot 机器人拦截（如果蜜罐字段被填写，静默返回成功但不入库）
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

    // 5. 写入 Supabase inquiries 表（纯写入，避免触发 anon RLS SELECT 权限拦截）
    const { error } = await supabase
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
          status: 'new', // 默认状态：new / pending / processed
        },
      ]);

    if (error) {
      console.error('[Supabase Inquiry Error]:', error);
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Failed to record inquiry into database.',
        }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // 6. 返回成功响应
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