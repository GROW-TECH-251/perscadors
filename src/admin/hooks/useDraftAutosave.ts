// src/admin/hooks/useDraftAutosave.ts
// ============================================
// Hook de sauvegarde automatique des brouillons
// ============================================
// Sauvegarde locale automatique pendant l'édition

import { useState, useEffect, useCallback, useRef } from 'react';

interface UseDraftAutosaveOptions<T> {
  key: string; // Clé unique pour le stockage
  initialValue: T; // Valeur initiale
  autosaveDelay?: number; // Délai avant autosave (ms)
  onSave?: (data: T) => void; // Callback lors de la sauvegarde
}

interface UseDraftAutosaveReturn<T> {
  data: T;
  setData: (data: T | ((prev: T) => T)) => void;
  isDirty: boolean; // Données modifiées non sauvegardées
  lastSavedAt: Date | null;
  clearDraft: () => void;
  saveNow: () => void;
}

export function useDraftAutosave<T>({
  key,
  initialValue,
  autosaveDelay = 2000,
  onSave
}: UseDraftAutosaveOptions<T>): UseDraftAutosaveReturn<T> {
  const [data, setDataInternal] = useState<T>(() => {
    // Charger depuis localStorage au montage
    try {
      const saved = localStorage.getItem(`draft_${key}`);
      if (saved) {
        return JSON.parse(saved) as T;
      }
    } catch (err: unknown) {
      console.error('Erreur chargement brouillon:', err);
    }
    return initialValue;
  });

  const [isDirty, setIsDirty] = useState(false);
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null);
  
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const dataRef = useRef<T>(data);

  // Garder la ref à jour
  useEffect(() => {
    dataRef.current = data;
  }, [data]);

  // Sauvegarde automatique
  const saveToStorage = useCallback(() => {
    try {
      localStorage.setItem(`draft_${key}`, JSON.stringify(dataRef.current));
      setLastSavedAt(new Date());
      setIsDirty(false);
      
      if (onSave) {
        onSave(dataRef.current);
      }
      
      console.log(`Brouillon sauvegardé: ${key}`);
    } catch (err: unknown) {
      console.error('Erreur sauvegarde brouillon:', err);
    }
  }, [key, onSave]);

  // Planifier la sauvegarde automatique
  const scheduleAutosave = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = setTimeout(() => {
      saveToStorage();
    }, autosaveDelay);
  }, [autosaveDelay, saveToStorage]);

  // Setter avec gestion dirty et autosave
  const setData = useCallback(
    (newData: T | ((prev: T) => T)) => {
      setDataInternal((prev) => {
        const updated = typeof newData === 'function' 
          ? (newData as (p: T) => T)(prev) 
          : newData;
        
        if (JSON.stringify(prev) !== JSON.stringify(updated)) {
          setIsDirty(true);
          scheduleAutosave();
        }
        
        return updated;
      });
    },
    [scheduleAutosave]
  );

  // Sauvegarde immédiate
  const saveNow = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    saveToStorage();
  }, [saveToStorage]);

  // Effacer le brouillon
  const clearDraft = useCallback(() => {
    localStorage.removeItem(`draft_${key}`);
    setDataInternal(initialValue);
    setIsDirty(false);
    setLastSavedAt(null);
  }, [key, initialValue]);

  // Nettoyage au démontage
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return {
    data,
    setData,
    isDirty,
    lastSavedAt,
    clearDraft,
    saveNow
  };
}

// ============================================
// HOOK UTILITAIRE : FORMULAIRE AVEC AUTOSAVE
// ============================================

interface UseAutosaveFormOptions<T> {
  key: string;
  initialValue: T;
  onSubmit: (data: T) => Promise<void>;
  autosaveDelay?: number;
}

interface UseAutosaveFormReturn<T> {
  formData: T;
  setFormData: (data: T | ((prev: T) => T)) => void;
  isDirty: boolean;
  isSubmitting: boolean;
  lastSavedAt: Date | null;
  submitForm: () => Promise<boolean>;
  cancelForm: () => void;
}

export function useAutosaveForm<T>({
  key,
  initialValue,
  onSubmit,
  autosaveDelay = 2000
}: UseAutosaveFormOptions<T>): UseAutosaveFormReturn<T> {
  const {
    data: formData,
    setData: setFormData,
    isDirty,
    lastSavedAt,
    clearDraft
  } = useDraftAutosave({
    key,
    initialValue,
    autosaveDelay
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  const submitForm = useCallback(async (): Promise<boolean> => {
    setIsSubmitting(true);
    try {
      await onSubmit(formData);
      clearDraft();
      return true;
    } catch (err: unknown) {
      console.error('Erreur soumission formulaire:', err);
      return false;
    } finally {
      setIsSubmitting(false);
    }
  }, [formData, onSubmit, clearDraft]);

  const cancelForm = useCallback(() => {
    clearDraft();
  }, [clearDraft]);

  return {
    formData,
    setFormData,
    isDirty,
    isSubmitting,
    lastSavedAt,
    submitForm,
    cancelForm
  };
}