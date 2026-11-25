# OpenPMS — PMS Open Source & Simulateur Pédagogique Hôtelier

Application web open source de **gestion hôtelière (PMS)** et **simulateur pédagogique** inspirée des interfaces modernes type Mews, développée dans le cadre du partenariat éducatif **HECh / Bénin (Projet LabDra)**.

## Fonctionnalités principales
- **Interface moderne inspirée de Mews** : Tableau de bord 360°, Timeline / Room Rack avec densité réglable (`Compact / Default / Comfortable`), recherche rapide globale et panneau latéral de détail (*Smart Detail Drawer*).
- **100 % Modulaire & Personnalisable** : Nombre de chambres, étages, devise (`FCFA`, `EUR`, `USD`), activation à la carte du *Room Service*, *Bar & Restauration*, *Minibar*, *Spa*, *Parking*, *Stocks* et politique de ménage (*Inclus / Au choix du client / Désactivé*).
- **Facturation modulaire** : TVA, taxe de séjour, frais de service, facturation scindée (*Entreprise / Client*), avoirs/remises, moyens de paiement configurables (`Cash`, `Carte`, `Mobile Money`, `Virement`...) et *Night Audit*.
- **Mémoire Multi-Projets par Membre** : Chaque membre dispose de son espace sauvegardé avec plusieurs hôtels/projets, export/import JSON et réinitialisation en 1 clic.
- **Espace Admin & Charte OpenPMS** : Inscription gratuite conditionnée à l'acceptation de la Charte de partage des statistiques opérationnelles ; tableau de bord Admin centralisant les membres, chambres réservées, chiffre d'affaires et articles vendus (export CSV/JSON + connecteur optionnel Supabase Free Tier).
- **Parcours Pédagogique complet (Niveaux 1 à 6)** : 20 scénarios pratiques, modes *Apprentissage / Exercice / Examen / Hôtel Réel*, quiz corrigés, horloge simulée et interface bilingue `FR / EN`.

## Déploiement gratuit sur GitHub Pages
Le workflow `.github/workflows/deploy.yml` déploie automatiquement l'application sur GitHub Pages à chaque push sur `main`.
Dans les paramètres du dépôt GitHub : **Settings → Pages → Build and deployment → Source : GitHub Actions**.
