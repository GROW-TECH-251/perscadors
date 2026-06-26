// src/admin/screens/QaChecklistScreen.tsx
// ============================================
// Écran de checklist qualité (QA)
// ============================================

import React, { useState } from 'react';
import { AdminCard, AdminButton } from '../components';
import { CheckSquare, Square, Save, RefreshCw } from 'lucide-react';

interface QaChecklistScreenProps {
  onBack: () => void;
}

interface ChecklistItem {
  id: string;
  category: string;
  label: string;
  checked: boolean;
}

const DEFAULT_CHECKLIST: ChecklistItem[] = [
  // Produits
  { id: 'p1', category: 'Produits', label: 'Tous les produits ont des images', checked: false },
  { id: 'p2', category: 'Produits', label: 'Les prix sont corrects', checked: false },
  { id: 'p3', category: 'Produits', label: 'Les stocks sont à jour', checked: false },
  { id: 'p4', category: 'Produits', label: 'Les descriptions sont complètes', checked: false },
  { id: 'p5', category: 'Produits', label: 'Les tailles et couleurs sont configurées', checked: false },
  
  // Commandes
  { id: 'c1', category: 'Commandes', label: 'Toutes les commandes en attente sont traitées', checked: false },
  { id: 'c2', category: 'Commandes', label: 'Les statuts sont à jour', checked: false },
  { id: 'c3', category: 'Commandes', label: 'Les clients ont été contactés', checked: false },
  
  // Site
  { id: 's1', category: 'Site', label: 'La page d\'accueil s\'affiche correctement', checked: false },
  { id: 's2', category: 'Site', label: 'Le panier fonctionne', checked: false },
  { id: 's3', category: 'Site', label: 'WhatsApp s\'ouvre correctement', checked: false },
  { id: 's4', category: 'Site', label: 'Le site est responsive mobile', checked: false },
  
  // Marketing
  { id: 'm1', category: 'Marketing', label: 'Les réseaux sociaux sont à jour', checked: false },
  { id: 'm2', category: 'Marketing', label: 'Les promotions sont actives', checked: false },
];

export const QaChecklistScreen: React.FC<QaChecklistScreenProps> = ({ onBack }) => {
  const [checklist, setChecklist] = useState<ChecklistItem[]>(() => {
    const saved = localStorage.getItem('qa_checklist');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return DEFAULT_CHECKLIST;
      }
    }
    return DEFAULT_CHECKLIST;
  });

  const toggleItem = (id: string) => {
    setChecklist(checklist.map(item =>
      item.id === id ? { ...item, checked: !item.checked } : item
    ));
  };

  const resetChecklist = () => {
    if (window.confirm('Réinitialiser toute la checklist ?')) {
      setChecklist(DEFAULT_CHECKLIST);
    }
  };

  const saveChecklist = () => {
    localStorage.setItem('qa_checklist', JSON.stringify(checklist));
    alert('Checklist sauvegardée !');
  };

  const progress = Math.round((checklist.filter(i => i.checked).length / checklist.length) * 100);

  const groupedByCategory = checklist.reduce((acc, item) => {
    if (!acc[item.category]) {
      acc[item.category] = [];
    }
    acc[item.category].push(item);
    return acc;
  }, {} as Record<string, ChecklistItem[]>);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-bebas text-3xl tracking-wider text-brand-text uppercase">
            Checklist QA
          </h1>
          <p className="text-brand-text-muted mt-1">
            Contrôle qualité avant livraison client
          </p>
        </div>
        <div className="flex gap-3">
          <AdminButton variant="secondary" onClick={resetChecklist}>
            <RefreshCw size={16} />
            Réinitialiser
          </AdminButton>
          <AdminButton variant="primary" onClick={saveChecklist}>
            <Save size={16} />
            Sauvegarder
          </AdminButton>
          <AdminButton variant="secondary" onClick={onBack}>
            Retour
          </AdminButton>
        </div>
      </div>

      {/* Progress */}
      <AdminCard>
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-bebas text-xl text-brand-text uppercase">
            Progression
          </h2>
          <span className="text-2xl font-bold text-brand-gold">{progress}%</span>
        </div>
        <div className="w-full h-4 bg-brand-bg-alt rounded-full overflow-hidden">
          <div
            className="h-full bg-brand-gold transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
        <p className="text-sm text-brand-text-muted mt-2">
          {checklist.filter(i => i.checked).length} / {checklist.length} items complétés
        </p>
      </AdminCard>

      {/* Checklist by Category */}
      {Object.entries(groupedByCategory).map(([category, items]) => {
        const categoryProgress = Math.round((items.filter(i => i.checked).length / items.length) * 100);
        
        return (
          <AdminCard key={category}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-bebas text-xl text-brand-text uppercase">
                {category}
              </h2>
              <span className="text-sm text-brand-text-muted">
                {items.filter(i => i.checked).length} / {items.length}
              </span>
            </div>

            <div className="space-y-2">
              {items.map((item) => (
                <button
                  key={item.id}
                  onClick={() => toggleItem(item.id)}
                  className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-brand-gold/5 transition-colors text-left cursor-pointer"
                >
                  {item.checked ? (
                    <CheckSquare size={20} className="text-brand-gold flex-shrink-0" />
                  ) : (
                    <Square size={20} className="text-brand-text-muted flex-shrink-0" />
                  )}
                  <span className={`text-brand-text ${item.checked ? 'line-through text-brand-text-muted' : ''}`}>
                    {item.label}
                  </span>
                </button>
              ))}
            </div>

            {/* Category Progress */}
            <div className="mt-4 w-full h-2 bg-brand-bg-alt rounded-full overflow-hidden">
              <div
                className="h-full bg-brand-gold/50 transition-all duration-500"
                style={{ width: `${categoryProgress}%` }}
              />
            </div>
          </AdminCard>
        );
      })}

      {/* 100% Complete */}
      {progress === 100 && (
        <AdminCard className="border-l-4 border-l-green-500 bg-green-50">
          <div className="text-center py-6">
            <CheckSquare size={48} className="mx-auto text-green-500 mb-4" />
            <h2 className="font-bebas text-2xl text-green-700 uppercase">
              Checklist complétée à 100% !
            </h2>
            <p className="text-green-600 mt-2">
              Votre boutique est prête pour la livraison client 🎉
            </p>
          </div>
        </AdminCard>
      )}
    </div>
  );
};