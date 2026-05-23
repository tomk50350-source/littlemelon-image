import { z } from "zod";

export const registerSchema = z.object({
  name: z.string().trim().min(1, "请输入昵称").max(30),
  email: z.string().trim().email("请输入正确邮箱"),
  password: z.string().min(6, "密码至少 6 位")
});

export const generationSchema = z.object({
  prompt: z.string().trim().min(4, "请写下你想生成或修改的内容").max(1200),
  scenario: z.enum(["ecommerce", "retouch", "patent", "creative"]),
  mode: z.enum(["text", "reference", "edit"]),
  sizeLabel: z.enum(["1K", "2K", "4K"]),
  quantity: z.number().int().min(1).max(2).default(1),
  referenceImages: z
    .array(z.string().startsWith("data:image/", "请上传图片文件"))
    .max(3, "最多上传 3 张参考图")
    .default([])
});

export const paymentSchema = z.object({
  provider: z.enum(["wechat", "alipay", "mock"]).default("mock"),
  planId: z.enum(["plus-990", "pro-9900", "payg-1k-50", "payg-2k-100", "payg-4k-200"]).default("plus-990")
});
