import { datasql as supabase } from '@/lib/datasql';

export async function checkUserReferralCode(userId: string, firstName: string) {
  // Check if they already have a code
  const { data: user } = await supabase.from('users').select('referral_code').eq('id', userId).single();
  
  if (!user?.referral_code) {
    const code = `${firstName.substring(0, 4).toUpperCase()}${Math.floor(10 + Math.random() * 90)}`;
    await supabase.from('users').update({ referral_code: code }).eq('id', userId);
    return code;
  }
  
  return user.referral_code;
}
