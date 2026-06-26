// src/middleware.ts
// University-admin qorunması səhifənin özündə client-side işləyir
// Bu middleware sadəcə boş buraxır

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(req: NextRequest) {
  return NextResponse.next();
}

export const config = {
  matcher: [],
};