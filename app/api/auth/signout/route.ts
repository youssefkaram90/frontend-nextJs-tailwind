
import { NextRequest } from "next/server";


const BACKEND_URL = process.env.BACKEND_URL;

export async function POST(request:NextRequest) {
    const cookie = request.headers.get('cookie') || "";
    const response = await fetch(`${BACKEND_URL}/signout`,{
        method:"POST",
        headers:{Cookie:cookie}
    });

    const setCookie = response.headers.get('set-cookie');

    const headers : Record<string,string>={}

    if(setCookie){
        headers['Set-Cookie'] = setCookie;
    }

    return new Response(null,{status:response.status,headers})
}