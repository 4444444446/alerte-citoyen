import { cookies } from "next/headers";
import { createHash, randomBytes } from "crypto";
import { db } from "./db";

const COOKIE="ac_session";
const DAYS=30;
const hash=(s:string)=>createHash("sha256").update(s).digest("hex");

export async function createSession(userId:string){
  const raw=randomBytes(32).toString("hex");
  await db.session.create({data:{userId,tokenHash:hash(raw),expiresAt:new Date(Date.now()+DAYS*86400000)}});
  const jar=await cookies();
  jar.set(COOKIE,raw,{httpOnly:true,secure:process.env.NODE_ENV==="production",sameSite:"lax",path:"/",maxAge:DAYS*86400});
}
export async function getCurrentUser(){
  const raw=(await cookies()).get(COOKIE)?.value;
  if(!raw)return null;
  const s=await db.session.findUnique({where:{tokenHash:hash(raw)},include:{user:true}});
  if(!s || s.expiresAt<new Date())return null;
  return s.user;
}
export async function destroySession(){
  const jar=await cookies(); const raw=jar.get(COOKIE)?.value;
  if(raw) await db.session.deleteMany({where:{tokenHash:hash(raw)}});
  jar.delete(COOKIE);
}
