import { NextRequest,NextResponse } from "next/server";
import { cookies } from "next/headers";
export async function GET(request:NextRequest,{params}:{params:{id:string}}){
    try{
        const token = request.cookies.get('token')?.value || 
                  request.cookies.get('authToken')?.value || 
                  request.headers.get('authorization')?.replace('Bearer ', '');
        if (!token) {
            return NextResponse.json({ message: 'No authentication token found' }, { status: 401 });
        }
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/organizations/${params.id}`, {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
          });
          if (!response.ok) {
            const errorText = await response.text();
            return NextResponse.json({ 
              message: `Backend API error: ${response.statusText}`,
              error: errorText 
            }, { status: response.status });
          }
      
          const data = await response.json();
          return NextResponse.json(data);
    }
    catch (error) {
        console.error('API Proxy Error:', error);
        return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
      }
}