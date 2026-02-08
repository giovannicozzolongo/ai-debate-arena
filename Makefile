.PHONY: serve test lint format

serve:
	uvicorn src.api.main:app --reload --port 8000

test:
	pytest tests/ -v

lint:
	ruff check src/

format:
	ruff format src/
