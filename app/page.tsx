import { redirect } from "next/navigation";
import { cookies } from "next/headers";

export default async function home(){
    const cookieStore = await cookies();
    const token = cookieStore.get('Authentication');

    if(token){
        redirect('dashboard');
    }

    redirect('/signin')
}