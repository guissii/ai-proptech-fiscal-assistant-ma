from __future__ import annotations

from pathlib import Path
import sys

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from report.generator import generate_report_to_file


def main() -> None:
    data = {
        "ville": "Rabat",
        "quartier": "Agdal",
        "prix": 1500000,
        "surface": 95,
        "financement": "Cash",
        "loyer_mensuel": 4000,
        "vacance_pct": 0,
        "gestion_pct": 5,
        "statut_salarie": True,
        "salaire_net_mensuel": 12000,
        "autres_revenus": 0,
        "annee_fiscale": 2026,
        "frais_entree": 120000,
        "cout_total": 1620000,
        "droits_enregistrement": 90000,
        "honoraires_notaire": 25000,
        "conservation_fonciere": 5000,
        "brut_annuel": 48000,
        "brut_effectif": 48000,
        "charges_non_fiscales": 12000,
        "depenses_exploitation": 8000,
        "frais_gestion": 2400,
        "assurance": 600,
        "taxes_locales_annuelles": 1000,
        "base_imposable": 28800,
        "impot_annuel": 2880,
        "net_annuel": 33120,
        "rendement_net_pct": 2.2,
        "cashflow_net_mois": 2760,
        "type_occupation_bien": "loue",
        "taxe_habitation_annuelle": 0,
        "taxe_services_communaux_annuelle": 1000,
        "airbnb_net_annuel": 52000,
        "airbnb_impot_annuel": 8000,
        "quartiers_comparaison": [
            {"nom": "Agdal", "rendement": 4.0},
            {"nom": "Hassan", "rendement": 3.6},
            {"nom": "Hay Riad", "rendement": 3.3},
            {"nom": "Souissi", "rendement": 2.7},
        ],
        "date_generation": "04/05/2026",
        "type_rapport": "Simulation",
    }

    out = Path(__file__).resolve().parent / "rapport_exemple.pdf"
    generate_report_to_file(data, out)
    print(f"PDF généré: {out}")


if __name__ == "__main__":
    main()
