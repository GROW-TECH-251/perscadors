-- Message WhatsApp préparé lors d'une nouvelle commande publique.
-- La colonne reste nullable pour préserver les installations déjà en production ;
-- le service applique le modèle chaleureux par défaut lorsque sa valeur est vide.
alter table public.shop_settings
  add column if not exists checkout_order_template text;
