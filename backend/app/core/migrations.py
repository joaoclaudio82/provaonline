from sqlalchemy import inspect, text
from sqlalchemy.engine import Engine


def migrate_schema(engine: Engine) -> None:
    """Aplica alterações incrementais em bancos já existentes (sem Alembic)."""
    inspector = inspect(engine)
    dialect = engine.dialect.name

    if "exam_config" in inspector.get_table_names():
        columns = {col["name"] for col in inspector.get_columns("exam_config")}
        if "allow_retake_all" not in columns:
            if dialect == "postgresql":
                with engine.begin() as conn:
                    conn.execute(
                        text(
                            "ALTER TABLE exam_config "
                            "ADD COLUMN IF NOT EXISTS allow_retake_all BOOLEAN NOT NULL DEFAULT FALSE"
                        )
                    )
            else:
                with engine.begin() as conn:
                    conn.execute(
                        text(
                            "ALTER TABLE exam_config "
                            "ADD COLUMN allow_retake_all BOOLEAN NOT NULL DEFAULT 0"
                        )
                    )

    if "students" in inspector.get_table_names():
        columns = {col["name"] for col in inspector.get_columns("students")}
        if "allow_retake" not in columns:
            if dialect == "postgresql":
                with engine.begin() as conn:
                    conn.execute(
                        text(
                            "ALTER TABLE students "
                            "ADD COLUMN IF NOT EXISTS allow_retake BOOLEAN NOT NULL DEFAULT FALSE"
                        )
                    )
            else:
                with engine.begin() as conn:
                    conn.execute(
                        text(
                            "ALTER TABLE students "
                            "ADD COLUMN allow_retake BOOLEAN NOT NULL DEFAULT 0"
                        )
                    )
