import {api} from "./api"

export interface SigninDto {
    name:string;
    password:string;
}

export async function signin(signinDto :SigninDto ){
    return api(
        '/api/auth/signin',
        {
        method:"POST",
        body:JSON.stringify(signinDto),
    });
}

export async function refreshToken() {
    return api<{ accessToken: string; refreshToken: string }>(
        '/api/auth/refresh',
        { method: "POST" }
    );
}