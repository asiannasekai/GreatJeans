"""Tests for catalog caching behavior."""
import logging
import pytest
from pathlib import Path
from backend import catalogs

def test_catalog_caching(tmp_path, caplog):
    """Test that catalogs are loaded once and cached."""
    caplog.set_level(logging.INFO)
    
    # Create test data files
    data_dir = tmp_path / "data"
    data_dir.mkdir()
    
    # Create minimal test files
    (data_dir / "traits_catalog.csv").write_text("id,name\n1,test\n")
    (data_dir / "clinvar_light.csv").write_text("id,condition\n1,test\n")
    (data_dir / "protein_map.csv").write_text("id,protein\n1,test\n")
    (data_dir / "pgs_bmi_small.csv").write_text("id,score\n1,1.0\n")
    (data_dir / "aa_windows.json").write_text('{"test": "data"}')
    
    # Set data directory
    catalogs.set_data_dir(data_dir)
    
    # First load - should read from disk
    _ = catalogs.get_traits_df()
    assert "Loading CSV from" in caplog.text
    caplog.clear()
    
    # Second load - should use cache
    _ = catalogs.get_traits_df()
    assert "Loading CSV from" not in caplog.text
    
    # Test all other catalogs
    _ = catalogs.get_clinvar_df()
    assert "Loading CSV from" in caplog.text
    caplog.clear()
    
    _ = catalogs.get_clinvar_df()  # cached
    assert "Loading CSV from" not in caplog.text
    
    # Clear caches and verify reload
    catalogs.clear_caches()
    _ = catalogs.get_traits_df()
    assert "Loading CSV from" in caplog.text

def test_data_dir_required():
    """Test that data dir must be set."""
    catalogs.set_data_dir(None)  # Reset data dir
    catalogs.clear_caches()
    with pytest.raises(RuntimeError, match="Data directory not set"):
        _ = catalogs.get_traits_df()

def test_missing_files(tmp_path):
    """Test graceful handling of missing files."""
    catalogs.set_data_dir(tmp_path)
    
    # Missing files should return empty DataFrame/dict
    assert len(catalogs.get_traits_df()) == 0
    assert len(catalogs.get_clinvar_df()) == 0
    assert len(catalogs.get_protein_map_df()) == 0
    assert len(catalogs.get_pgs_df()) == 0
    assert len(catalogs.get_aa_windows()) == 0
