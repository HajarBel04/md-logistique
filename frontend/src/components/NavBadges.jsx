// Compteurs d'urgence affichés dans le menu : échéances expirées et messages non lus.
// Une seule requête partagée (tableau de bord), rafraîchie toutes les 60 s et au retour sur l'onglet.
import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { flotteApi } from '../flotte/api';

const Ctx = createContext({});

export function NavBadgesProvider({ children }) {
  const [badges, setBadges] = useState({});

  const refresh = useCallback(() => {
    flotteApi.dashboard()
      .then((d) => setBadges({ '/conformite': d?.kpis?.expired || 0, '/messagerie': d?.kpis?.unreadMessages || 0 }))
      .catch(() => {}); // les badges sont un confort : jamais d'erreur affichée pour eux
  }, []);

  useEffect(() => {
    refresh();
    const t = setInterval(() => { if (!document.hidden) refresh(); }, 60000);
    const onVisible = () => { if (!document.hidden) refresh(); };
    document.addEventListener('visibilitychange', onVisible);
    return () => { clearInterval(t); document.removeEventListener('visibilitychange', onVisible); };
  }, [refresh]);

  return <Ctx.Provider value={badges}>{children}</Ctx.Provider>;
}

export const useNavBadges = () => useContext(Ctx);
