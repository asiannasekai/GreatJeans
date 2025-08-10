export const DEMO_DATA = {
  "qc": {
    "format": "23andme",
    "n_snps": 5,
    "missing_pct": 0.0,
    "allele_sanity": 0.95
  },
  "genome_window": {
    "chrom": "chr17",
    "start": 7676125,
    "end": 7676175,
    "rsid": "rs1042522"
  },
  "variants": [
    {
      "rsid": "rs1042522",
      "chrom": "chr17",
      "pos": 7676150,
      "genotype": "GG",
      "gene": "TP53",
      "consequence": "missense_variant",
      "links": {
        "dbsnp": "https://www.ncbi.nlm.nih.gov/snp/rs1042522",
        "ensembl": "https://www.ensembl.org/Homo_sapiens/Variation/Explore?db=core;r=chr17:7676150-7676150;v=rs1042522"
      }
    }
  ],
  "traits": [
    {
      "trait": "Lactose tolerance",
      "rsid": "rs4988235",
      "effect_allele": "T",
      "your_genotype": "CT",
      "status": "covered",
      "source_url": "https://www.snpedia.com/index.php/rs4988235"
    },
    {
      "trait": "Caffeine metabolism",
      "rsid": "rs762551",
      "effect_allele": "A",
      "your_genotype": "AA",
      "status": "covered",
      "source_url": "https://www.snpedia.com/index.php/rs762551"
    },
    {
      "trait": "Vitamin B12 levels",
      "rsid": "rs602662",
      "effect_allele": "G",
      "your_genotype": "GG",
      "status": "covered",
      "source_url": "https://www.snpedia.com/index.php/rs602662"
    }
  ],
  "protein": {
    "uniprot": "P04637",
    "alphafold_cif_url": "https://alphafold.ebi.ac.uk/files/AF-P04637-F1-model_v4.cif",
    "residues": [
      {
        "rsid": "rs1042522",
        "index": 72,
        "protein_change": "p.Pro72Arg"
      }
    ]
  },
  "pgs": {
    "bmi": {
      "z": 0.84,
      "percentile": 80,
      "pgs_id": "PGS000000-demo",
      "note": "relative only"
    }
  },
  "ai_summary": {
    "paragraph": "Demo: Your file includes a common TP53 variant (p.Pro72Arg). We visualize the site on the protein and provide non-medical, educational context. Trait rows show exactly which SNPs were used and whether they were covered.",
    "caveats": [
      "coverage limits",
      "population limits",
      "not medical advice"
    ]
  },
  "mini_model": {
    "window": {
      "center": 72,
      "length": 21
    },
    "wt": {
      "confidence": 0.75
    }
  },
  "disclaimer": "This is demonstration data for educational purposes only. Not for medical use."
};
