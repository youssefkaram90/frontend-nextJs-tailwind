import {api} from "./api"

export interface SinginDto {
    name:string;
    password:string;
}

export async function singin(singinDto :SinginDto ){
    return api(
        '/auth/signin',
        {
        method:"POST",
        body:JSON.stringify(singinDto),
    });
}