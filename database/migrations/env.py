import asyncio, sys, os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "../../backend"))
from logging.config import fileConfig
from sqlalchemy import pool
from sqlalchemy.engine import Connection
from sqlalchemy.ext.asyncio import async_engine_from_config
from alembic import context
from app.models.models import Base
from app.core.config import get_settings

config = context.config
settings = get_settings()
config.set_main_option("sqlalchemy.url", settings.database_url)
if config.config_file_name: fileConfig(config.config_file_name)
target_metadata = Base.metadata

def run_migrations_offline():
    context.configure(url=config.get_main_option("sqlalchemy.url"), target_metadata=target_metadata, literal_binds=True)
    with context.begin_transaction(): context.run_migrations()

def do_run_migrations(connection: Connection):
    context.configure(connection=connection, target_metadata=target_metadata)
    with context.begin_transaction(): context.run_migrations()

async def run_async_migrations():
    connectable = async_engine_from_config(config.get_section(config.config_ini_section, {}), prefix="sqlalchemy.", poolclass=pool.NullPool)
    async with connectable.connect() as connection: await connection.run_sync(do_run_migrations)
    await connectable.dispose()

def run_migrations_online(): asyncio.run(run_async_migrations())

if context.is_offline_mode(): run_migrations_offline()
else: run_migrations_online()
