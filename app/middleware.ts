import { NextRequest, NextResponse } from "next/server";

const publicPaths = ['/signin','/signout'];

export function middleware(request:NextRequest){
const token = request.cookies.get('Authentication')?.value;
const {pathname} = request.nextUrl;

if(publicPaths.some((p) => pathname.startsWith(p))){
    return NextResponse.next();
}

if(!token){
    return NextResponse.redirect(new URL('/signin',request.url))
}

return NextResponse.next();
}

export const config ={
    matcher:["/((?!api|_next/static|_next/image|favicon.ico).*)"]
}