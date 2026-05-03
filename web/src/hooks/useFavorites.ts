"use client";

import { useState, useEffect, useCallback } from "react";
import { listFavorites, toggleFavoriteDB } from "@/lib/api-client";

const STORAGE_KEY = "ornalens_favorites";

export function useFavorites() {
  const getToken = async () => null;
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [loaded, setLoaded] = useState(false);

  // 1. Load from localStorage immediately (instant render)
  // 2. Then fetch from DB and reconcile
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) setFavorites(new Set(JSON.parse(stored)));
    } catch { /* ignore */ }

    listFavorites(getToken)
      .then((ids) => {
        setFavorites(new Set(ids));
        localStorage.setItem(STORAGE_KEY, JSON.stringify(ids));
      })
      .catch(() => { /* offline — keep localStorage copy */ })
      .finally(() => setLoaded(true));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Optimistic toggle: update local state immediately, then sync DB
  const toggleFavorite = useCallback((id: string) => {
    setFavorites((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(Array.from(next)));
      return next;
    });

    toggleFavoriteDB(id, getToken).catch(() => {
      // Revert on failure
      setFavorites((prev) => {
        const next = new Set(prev);
        next.has(id) ? next.delete(id) : next.add(id);
        return next;
      });
    });
  }, [getToken]);

  const isFavorite = useCallback(
    (id: string) => favorites.has(id),
    [favorites]
  );

  return { favorites, loaded, toggleFavorite, isFavorite };
}
