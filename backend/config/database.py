from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base

# The database file path on your disk
DATABASE_URL = "sqlite:///./groww_sandbox.db"

# Setting up the core engine connection
engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

# Function to cleanly manage opening and closing connections
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()