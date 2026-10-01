import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const path = join(process.cwd(), 'dist', 'index.html');
const site = 'https://our-cozy-home-eight.vercel.app';
const description = '친구를 초대해 최대 4명이 같은 집에서 동물을 키우고, 방을 꾸미고, 함께한 추억을 가구로 남겨요.';
const metadata = `<meta name="theme-color" content="#FFF8E8" /><meta name="description" content="${description}" /><meta property="og:type" content="website" /><meta property="og:locale" content="ko_KR" /><meta property="og:site_name" content="우리집" /><meta property="og:title" content="우리집 | 친구 동물들과 함께 만드는 작은 집" /><meta property="og:description" content="${description}" /><meta property="og:url" content="${site}" /><meta property="og:image" content="${site}/og-image.png" /><meta name="twitter:card" content="summary_large_image" /><meta name="twitter:title" content="우리집 | 친구 동물들과 함께 만드는 작은 집" /><meta name="twitter:description" content="${description}" /><meta name="twitter:image" content="${site}/og-image.png" />`;
const html = readFileSync(path, 'utf8').replace('</head>', `${metadata}</head>`);
writeFileSync(path, html);
