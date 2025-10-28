import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  const redirect = req.nextUrl.searchParams.get('redirect') || '/map'
  return NextResponse.redirect(new URL(redirect, req.url))
}
