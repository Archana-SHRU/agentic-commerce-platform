"""
Entrypoint: run with `python seed.py` from the backend/ directory
(after `alembic upgrade head` has created the tables).
"""
from app.db.seed_data import seed

if __name__ == "__main__":
    seed()
