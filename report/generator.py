from __future__ import annotations

import base64
import datetime as _dt
import os
from dataclasses import dataclass
from pathlib import Path
from typing import Any, Dict, Optional

from jinja2 import Environment, FileSystemLoader, select_autoescape


@dataclass(frozen=True)
class _Assets:
    root: Path
    template_path: Path
    css_path: Path
    logo_path: Path
    inter_regular_woff2: Path
    inter_medium_woff2: Path
    inter_semibold_woff2: Path
    inter_bold_woff2: Path


def _assets_dir() -> _Assets:
    root = Path(__file__).resolve().parent
    assets = root / "assets"
    return _Assets(
        root=root,
        template_path=root / "template.html",
        css_path=root / "styles.css",
        logo_path=assets / "logo.png",
        inter_regular_woff2=assets / "Inter-Regular.woff2",
        inter_medium_woff2=assets / "Inter-Medium.woff2",
        inter_semibold_woff2=assets / "Inter-SemiBold.woff2",
        inter_bold_woff2=assets / "Inter-Bold.woff2",
    )


def _format_mad(value: Any) -> str:
    if value is None:
        return "— Non disponible —"
    try:
        x = float(value)
    except Exception:
        return "— Non disponible —"
    s = f"{int(round(x)):,}".replace(",", " ")
    return f"{s} MAD"


def _format_pct(value: Any) -> str:
    if value is None:
        return "— Non disponible —"
    try:
        x = float(value)
    except Exception:
        return "— Non disponible —"
    return f"{x:.1f}%"


def _safe_str(value: Any) -> str:
    if value is None:
        return "— Non disponible —"
    s = str(value).strip()
    return s if s else "— Non disponible —"


def _bool_label(value: Any) -> str:
    if value is None:
        return "— Non disponible —"
    return "Oui" if bool(value) else "Non"


def _infer_generation_date(data: Dict[str, Any]) -> str:
    v = data.get("date_generation")
    if isinstance(v, str) and v.strip():
        return v.strip()
    return _dt.date.today().strftime("%d/%m/%Y")


def _progressive_ir_annual(income_annual: float, tax_year: int) -> float:
    x = max(0.0, float(income_annual))
    year = int(tax_year) if tax_year else 2026
    table = [
        {"max": 30000, "rate": 0.0, "deduction": 0.0},
        {"max": 50000, "rate": 0.10, "deduction": 3000.0},
        {"max": 60000, "rate": 0.20, "deduction": 8000.0},
        {"max": 80000, "rate": 0.30, "deduction": 14000.0},
        {"max": 180000, "rate": 0.34, "deduction": 17200.0},
        {"max": float("inf"), "rate": 0.38, "deduction": 24400.0},
    ]
    _ = year
    row = next((r for r in table if x <= r["max"]), table[-1])
    return max(0.0, x * float(row["rate"]) - float(row["deduction"]))


def _ir_bracket_rows(tax_year: int) -> list[dict[str, Any]]:
    year = int(tax_year) if tax_year else 2026
    _ = year
    return [
        {"label": "0 → 30 000", "max": 30000, "rate": "0%", "deduction": "0"},
        {"label": "30 001 → 50 000", "max": 50000, "rate": "10%", "deduction": "3 000"},
        {"label": "50 001 → 60 000", "max": 60000, "rate": "20%", "deduction": "8 000"},
        {"label": "60 001 → 80 000", "max": 80000, "rate": "30%", "deduction": "14 000"},
        {"label": "80 001 → 180 000", "max": 180000, "rate": "34%", "deduction": "17 200"},
        {"label": "≥ 180 001", "max": None, "rate": "38%", "deduction": "24 400"},
    ]


def _find_bracket_index(income_annual: float, tax_year: int) -> int:
    x = max(0.0, float(income_annual))
    rows = _ir_bracket_rows(tax_year)
    for i, r in enumerate(rows):
        mx = r.get("max")
        if mx is None:
            return i
        if x <= float(mx):
            return i
    return len(rows) - 1


def _explain_yield(rendement_pct: Any) -> str:
    if rendement_pct is None:
        return "— Non disponible —"
    try:
        r = float(rendement_pct)
    except Exception:
        return "— Non disponible —"
    return (
        f"Pour 100 MAD investis, vous gagnez environ {r:.1f} MAD par an. "
        f"C’est une manière simple de comparer avec d’autres placements."
    )


def _explain_abattement() -> str:
    return (
        "L’État considère qu’une partie de vos loyers sert à entretenir le bien. "
        "Cette partie n’est pas imposée (abattement)."
    )


def _explain_cashflow(value: Any) -> str:
    if value is None:
        return "— Non disponible —"
    try:
        x = float(value)
    except Exception:
        return "— Non disponible —"
    base = _format_mad(x)
    if x >= 0:
        return f"Après charges et impôts, il vous reste environ {base} chaque mois."
    return f"Après charges et impôts, il vous manque environ {base} chaque mois (effort de trésorerie)."


def _explain_fee() -> str:
    return (
        "Ces frais sont obligatoires et généralement non négociables. "
        "Il faut les prévoir en plus du prix d’achat."
    )


def _load_optional_font_base64(path: Path) -> Optional[str]:
    try:
        if not path.exists():
            return None
        raw = path.read_bytes()
        return base64.b64encode(raw).decode("ascii")
    except Exception:
        return None


def _build_font_css(assets: _Assets) -> str:
    parts: list[str] = []
    regular = _load_optional_font_base64(assets.inter_regular_woff2)
    medium = _load_optional_font_base64(assets.inter_medium_woff2)
    semibold = _load_optional_font_base64(assets.inter_semibold_woff2)
    bold = _load_optional_font_base64(assets.inter_bold_woff2)
    mapping = [
        ("Inter", 400, regular),
        ("Inter", 500, medium),
        ("Inter", 600, semibold),
        ("Inter", 700, bold),
    ]
    for family, weight, b64 in mapping:
        if not b64:
            continue
        parts.append(
            "\n".join(
                [
                    "@font-face {",
                    f"  font-family: '{family}';",
                    "  font-style: normal;",
                    f"  font-weight: {weight};",
                    f"  src: url('data:font/woff2;base64,{b64}') format('woff2');",
                    "}",
                ]
            )
        )
    return "\n".join(parts).strip()


def _logo_data_uri(assets: _Assets) -> Optional[str]:
    if not assets.logo_path.exists():
        return None
    try:
        raw = assets.logo_path.read_bytes()
        b64 = base64.b64encode(raw).decode("ascii")
        return f"data:image/png;base64,{b64}"
    except Exception:
        return None


def _prepare_context(data: Dict[str, Any]) -> Dict[str, Any]:
    ville = _safe_str(data.get("ville"))
    quartier = _safe_str(data.get("quartier"))
    prix = data.get("prix")
    surface = data.get("surface")
    financement = _safe_str(data.get("financement"))
    loyer_mensuel = data.get("loyer_mensuel")
    vacance_pct = data.get("vacance_pct")
    gestion_pct = data.get("gestion_pct")
    statut_salarie = bool(data.get("statut_salarie")) if data.get("statut_salarie") is not None else None
    salaire_net_mensuel = data.get("salaire_net_mensuel")
    autres_revenus = data.get("autres_revenus")
    annee_fiscale = int(data.get("annee_fiscale") or 2026)

    salaire_annuel = float(salaire_net_mensuel or 0) * 12 if statut_salarie else 0.0
    autres_revenus_annuel = float(autres_revenus or 0)

    base_imposable = float(data.get("base_imposable") or 0)
    total_income_without = salaire_annuel + autres_revenus_annuel
    total_income_with = total_income_without + base_imposable
    ir_without = _progressive_ir_annual(total_income_without, annee_fiscale)
    ir_with = _progressive_ir_annual(total_income_with, annee_fiscale)
    ir_incremental = max(0.0, ir_with - ir_without)

    bracket_index = _find_bracket_index(total_income_with if statut_salarie else base_imposable, annee_fiscale)
    bracket_rows = _ir_bracket_rows(annee_fiscale)

    quartiers_comparaison = data.get("quartiers_comparaison") or None
    if isinstance(quartiers_comparaison, list):
        cleaned = []
        for it in quartiers_comparaison:
            if not isinstance(it, dict):
                continue
            name = it.get("nom") or it.get("name")
            yield_ = it.get("rendement") or it.get("yield") or it.get("rendement_net_pct")
            try:
                yield_v = float(yield_) if yield_ is not None else None
            except Exception:
                yield_v = None
            if not name:
                continue
            cleaned.append({"nom": str(name), "rendement": yield_v})
        quartiers_comparaison = cleaned or None
    else:
        quartiers_comparaison = None

    airbnb_net = data.get("airbnb_net_annuel")
    airbnb_tax = data.get("airbnb_impot_annuel")
    has_airbnb = airbnb_net is not None or airbnb_tax is not None

    net_annuel = data.get("net_annuel")
    cashflow = data.get("cashflow_net_mois")
    impot_annuel = data.get("impot_annuel")
    brut_annuel_raw = data.get("brut_annuel")
    brut_effectif_raw = data.get("brut_effectif")
    charges_non_fiscales_raw = data.get("charges_non_fiscales")

    def as_float(v: Any) -> Optional[float]:
        if v is None:
            return None
        try:
            x = float(v)
        except Exception:
            return None
        if not (x == x):
            return None
        return x

    brut_annuel_v = as_float(brut_annuel_raw)
    brut_effectif_v = as_float(brut_effectif_raw)
    charges_non_fiscales_v = as_float(charges_non_fiscales_raw)
    base_imposable_v = as_float(data.get("base_imposable")) or 0.0
    impot_annuel_v = as_float(impot_annuel)
    net_annuel_v = as_float(net_annuel)

    vacance_montant_v: Optional[float] = None
    if brut_annuel_v is not None and brut_effectif_v is not None:
        vacance_montant_v = max(0.0, brut_annuel_v - brut_effectif_v)

    abattement_pct = 0.40
    abattement_montant_v: Optional[float] = None
    if brut_effectif_v is not None:
        abattement_montant_v = max(0.0, brut_effectif_v * abattement_pct)

    charges_detail = {
        "depenses_exploitation": data.get("depenses_exploitation"),
        "frais_gestion": data.get("frais_gestion"),
        "assurance": data.get("assurance"),
        "taxes_locales": data.get("taxes_locales_annuelles"),
    }
    charges_detail_fmt = {
        "depenses_exploitation": _format_mad(charges_detail["depenses_exploitation"]),
        "frais_gestion": _format_mad(charges_detail["frais_gestion"]),
        "assurance": _format_mad(charges_detail["assurance"]),
        "taxes_locales": _format_mad(charges_detail["taxes_locales"]),
    }
    has_charges_breakdown = any(v is not None for v in charges_detail.values())

    fees_optional = {
        "frais_agence": data.get("frais_agence"),
        "frais_dossier": data.get("frais_dossier"),
        "timbre": data.get("timbre"),
        "frais_credit": data.get("frais_credit"),
    }
    fees_optional_fmt = {k: _format_mad(v) for k, v in fees_optional.items()}
    has_optional_fees = any(v is not None for v in fees_optional.values())

    type_occupation = data.get("type_occupation_bien")
    type_occupation_label = (
        "Résidence principale / occupé"
        if type_occupation in ("propre", "principal", "residence_principale")
        else "Loué"
        if type_occupation in ("loue", "loué", "location")
        else "— Non disponible —"
    )
    taxe_habitation = data.get("taxe_habitation_annuelle")
    taxe_services = data.get("taxe_services_communaux_annuelle")
    taxes_locales_total = data.get("taxes_locales_annuelles") or data.get("taxes_locales_annuelles_total")

    best_strategy = None
    if has_airbnb and net_annuel is not None:
        try:
            l_net = float(net_annuel)
            a_net = float(airbnb_net) if airbnb_net is not None else None
            if a_net is not None:
                best_strategy = "Airbnb" if a_net > l_net else "Location longue durée"
        except Exception:
            best_strategy = None

    return {
        "meta": {
            "type_rapport": _safe_str(data.get("type_rapport") or "Simulation"),
            "date_generation": _infer_generation_date(data),
        },
        "inputs": {
            "ville": ville,
            "quartier": quartier,
            "prix": _format_mad(prix),
            "surface": f"{float(surface):.0f} m²" if surface is not None else "— Non disponible —",
            "financement": financement,
            "loyer_mensuel": _format_mad(loyer_mensuel),
            "vacance_pct": _format_pct(vacance_pct),
            "gestion_pct": _format_pct(gestion_pct),
            "statut_salarie": _bool_label(statut_salarie) if statut_salarie is not None else "— Non disponible —",
            "salaire_net_mensuel": _format_mad(salaire_net_mensuel),
            "autres_revenus": _format_mad(autres_revenus_annuel),
            "annee_fiscale": str(annee_fiscale),
        },
        "results": {
            "frais_entree": _format_mad(data.get("frais_entree")),
            "cout_total": _format_mad(data.get("cout_total")),
            "droits_enregistrement": _format_mad(data.get("droits_enregistrement")),
            "honoraires_notaire": _format_mad(data.get("honoraires_notaire")),
            "conservation_fonciere": _format_mad(data.get("conservation_fonciere")),
            "brut_annuel": _format_mad(data.get("brut_annuel")),
            "brut_effectif": _format_mad(data.get("brut_effectif")),
            "charges_non_fiscales": _format_mad(data.get("charges_non_fiscales")),
            "base_imposable": _format_mad(data.get("base_imposable")),
            "impot_annuel": _format_mad(impot_annuel),
            "net_annuel": _format_mad(net_annuel),
            "rendement_net_pct": _format_pct(data.get("rendement_net_pct")),
            "cashflow_net_mois": _format_mad(cashflow),
            "vacance_montant": _format_mad(vacance_montant_v),
            "abattement_montant": _format_mad(abattement_montant_v),
        },
        "achat": {
            "optional_fees_enabled": bool(has_optional_fees),
            "frais_agence": fees_optional_fmt["frais_agence"],
            "frais_dossier": fees_optional_fmt["frais_dossier"],
            "timbre": fees_optional_fmt["timbre"],
            "frais_credit": fees_optional_fmt["frais_credit"],
        },
        "charges": {
            "breakdown_enabled": bool(has_charges_breakdown),
            "depenses_exploitation": charges_detail_fmt["depenses_exploitation"],
            "frais_gestion": charges_detail_fmt["frais_gestion"],
            "assurance": charges_detail_fmt["assurance"],
            "taxes_locales": charges_detail_fmt["taxes_locales"],
        },
        "taxes_locales": {
            "enabled": any(v is not None for v in [taxe_habitation, taxe_services, taxes_locales_total]),
            "type_occupation": type_occupation_label,
            "taxe_habitation_annuelle": _format_mad(taxe_habitation),
            "taxe_services_communaux_annuelle": _format_mad(taxe_services),
            "taxes_locales_annuelles": _format_mad(taxes_locales_total),
        },
        "airbnb": {
            "enabled": bool(has_airbnb),
            "net_annuel": _format_mad(airbnb_net),
            "impot_annuel": _format_mad(airbnb_tax),
        },
        "comparaison": {
            "best_strategy": best_strategy,
        },
        "fiscalite": {
            "enabled": bool(impot_annuel is not None),
            "abattement_pct": "40%",
            "abattement_montant": _format_mad(abattement_montant_v),
            "abattement_explain": _explain_abattement(),
            "brackets": bracket_rows,
            "bracket_index": bracket_index,
            "avec_sans_enabled": bool(statut_salarie),
            "total_income_without": _format_mad(total_income_without),
            "total_income_with": _format_mad(total_income_with),
            "ir_without": _format_mad(ir_without),
            "ir_with": _format_mad(ir_with),
            "ir_incremental": _format_mad(ir_incremental),
            "impot_locatif_explain": (
                "L’impôt locatif est calculé sur la base imposable (après abattement). "
                "Si vous êtes salarié, l’impact peut être progressif : on compare votre impôt total “avec” et “sans” ce bien."
            ),
        },
        "quartiers": {
            "enabled": quartiers_comparaison is not None,
            "rows": quartiers_comparaison,
        },
        "explain": {
            "frais_entree": _explain_fee(),
            "rendement": _explain_yield(data.get("rendement_net_pct")),
            "cashflow": _explain_cashflow(cashflow),
        },
    }


def generate_report(data: Dict[str, Any]) -> bytes:
    assets = _assets_dir()

    env = Environment(
        loader=FileSystemLoader(str(assets.root)),
        autoescape=select_autoescape(["html", "xml"]),
    )
    template = env.get_template("template.html")

    font_css = _build_font_css(assets)
    css_text = assets.css_path.read_text(encoding="utf-8")
    if font_css:
        css_text = f"{font_css}\n{css_text}"

    ctx = _prepare_context(dict(data or {}))
    ctx["assets"] = {
        "logo_data_uri": _logo_data_uri(assets),
    }

    html = template.render(**ctx)
    base_url = str(assets.root)
    try:
        from weasyprint import CSS, HTML  # type: ignore
    except OSError as e:  # pragma: no cover
        raise RuntimeError(
            "WeasyPrint est installé mais ses dépendances système (Pango/GTK/GObject) manquent. "
            "Sous Windows, installez GTK via MSYS2 ou exécutez ce générateur dans un environnement Linux."
        ) from e
    except Exception as e:  # pragma: no cover
        raise RuntimeError("WeasyPrint n'est pas disponible. Installez weasyprint puis relancez.") from e
    try:
        return HTML(string=html, base_url=base_url).write_pdf(stylesheets=[CSS(string=css_text)])
    except OSError as e:  # pragma: no cover
        raise RuntimeError(
            "WeasyPrint est installé mais ses dépendances système (Pango/GTK/GObject) manquent. "
            "Sous Windows, installez GTK3/GTK4 (MSYS2 recommandé) ou utilisez un environnement Linux."
        ) from e


def generate_report_to_file(data: Dict[str, Any], output_path: str | os.PathLike[str]) -> None:
    pdf_bytes = generate_report(data)
    Path(output_path).write_bytes(pdf_bytes)
