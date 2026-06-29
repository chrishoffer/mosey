import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from './supabase';
import { useAuth } from './auth';
import { queryClient } from './queryClient';

/**
 * Whose account am I acting in? Everyone has their own account (id = their user
 * id). If someone shares their account with you, it shows up here too and you can
 * switch to it. The DB's can_access()/RLS guarantees you can only ever reach
 * accounts you own or are an active member of — this context just picks which one
 * the UI reads from and writes to.
 */
export interface AccountInfo {
  id: string; // the owner's profile/user id
  label: string;
  isOwn: boolean;
}

interface AccountState {
  accounts: AccountInfo[];
  currentAccountId: string | null;
  isShared: boolean; // viewing someone else's account
  setCurrentAccountId: (id: string) => void;
  refresh: () => Promise<void>;
  loading: boolean;
}

const Ctx = createContext<AccountState | undefined>(undefined);

export function AccountProvider({ children }: { children: React.ReactNode }) {
  const { session } = useAuth();
  const uid = session?.user?.id ?? null;

  const [accounts, setAccounts] = useState<AccountInfo[]>([]);
  const [currentAccountId, setCurrent] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!uid) {
      setAccounts([]);
      setCurrent(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    // Claim any invites addressed to my email (no-op if none).
    try {
      await supabase.rpc('claim_invites');
    } catch {
      /* sharing not enabled yet (migration not run) — degrade to own account */
    }

    const own: AccountInfo = { id: uid, label: 'You', isOwn: true };
    let shared: AccountInfo[] = [];
    try {
      const { data: memberships } = await supabase
        .from('account_members')
        .select('owner_id')
        .eq('member_id', uid)
        .eq('status', 'active');
      const ownerIds = (memberships ?? [])
        .map((m: { owner_id: string }) => m.owner_id)
        .filter((x: string) => x !== uid);
      if (ownerIds.length) {
        const { data: profs } = await supabase
          .from('profiles')
          .select('id, display_name')
          .in('id', ownerIds);
        const nameById = new Map((profs ?? []).map((p: { id: string; display_name: string | null }) => [p.id, p.display_name]));
        shared = ownerIds.map((id: string) => ({
          id,
          label: `${nameById.get(id) || 'Shared'}’s account`,
          isOwn: false,
        }));
      }
    } catch {
      shared = [];
    }

    const list = [own, ...shared];
    setAccounts(list);
    const stored = await AsyncStorage.getItem(`mosey.account.${uid}`);
    setCurrent(stored && list.some((a) => a.id === stored) ? stored : uid);
    setLoading(false);
  }, [uid]);

  useEffect(() => {
    load();
  }, [load]);

  const setCurrentAccountId = useCallback(
    (id: string) => {
      setCurrent(id);
      if (uid) AsyncStorage.setItem(`mosey.account.${uid}`, id);
      // The account-scoped lists must refetch for the newly selected account.
      queryClient.invalidateQueries({ queryKey: ['trips'] });
      queryClient.invalidateQueries({ queryKey: ['children'] });
      queryClient.invalidateQueries({ queryKey: ['profile'] });
    },
    [uid],
  );

  return (
    <Ctx.Provider
      value={{
        accounts,
        currentAccountId,
        isShared: !!currentAccountId && currentAccountId !== uid,
        setCurrentAccountId,
        refresh: load,
        loading,
      }}
    >
      {children}
    </Ctx.Provider>
  );
}

export function useAccount(): AccountState {
  const c = useContext(Ctx);
  if (!c) throw new Error('useAccount must be used within AccountProvider');
  return c;
}
