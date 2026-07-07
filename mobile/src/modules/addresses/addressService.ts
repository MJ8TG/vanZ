import { datasql } from '@/lib/supabase';

export type SavedAddress = {
  id: string;
  label: string;
  address: string;
  floor: string | null;
  is_default: boolean;
};

export class AddressService {
  static async fetch(userId: string): Promise<SavedAddress[]> {
    const { data, error } = await datasql
      .from('saved_addresses')
      .select('id, label, address, floor, is_default')
      .eq('user_id', userId)
      .order('is_default', { ascending: false })
      .order('created_at', { ascending: false });
    if (error) throw error;
    return (data || []) as SavedAddress[];
  }

  static async create(
    userId: string,
    input: { label: string; address: string; floor: string | null; isDefault: boolean }
  ): Promise<SavedAddress> {
    const { data, error } = await datasql
      .from('saved_addresses')
      .insert({
        user_id: userId,
        label: input.label,
        address: input.address,
        floor: input.floor,
        is_default: input.isDefault,
      })
      .select('id, label, address, floor, is_default')
      .single();
    if (error) throw error;
    return data as SavedAddress;
  }

  static async remove(id: string): Promise<void> {
    const { error } = await datasql.from('saved_addresses').delete().eq('id', id);
    if (error) throw error;
  }

  /** Clears the existing default for the user, then marks `id` as default. */
  static async setDefault(userId: string, id: string): Promise<void> {
    const { error: e1 } = await datasql.from('saved_addresses').update({ is_default: false }).eq('user_id', userId);
    const { error: e2 } = await datasql.from('saved_addresses').update({ is_default: true }).eq('id', id);
    if (e1 || e2) throw e1 || e2;
  }
}
