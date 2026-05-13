from backend.database import engine, create_db_and_tables
from backend.models import PHCDirectory
from sqlmodel import Session

def seed_phcs():
    create_db_and_tables()
    
    phcs = [
        PHCDirectory(
            district="Bengaluru Rural",
            sub_centre="Hoskote Town",
            phc_name="Hoskote General Hospital",
            phc_phone="080-27931555",
            medical_officer_name="Dr. Anand R.",
            state="Karnataka"
        ),
        PHCDirectory(
            district="Ramanagara",
            sub_centre="Kanakapura",
            phc_name="Kanakapura Taluk Hospital",
            phc_phone="080-27522555",
            medical_officer_name="Dr. Manjula S.",
            state="Karnataka"
        ),
        PHCDirectory(
            district="Tumakuru",
            sub_centre="Koratagere",
            phc_name="Koratagere CHC",
            phc_phone="08138-232555",
            medical_officer_name="Dr. Srinivas K.",
            state="Karnataka"
        ),
        PHCDirectory(
            district="Mysuru",
            sub_centre="Hunsur",
            phc_name="Hunsur Taluk Hospital",
            phc_phone="08222-252555",
            medical_officer_name="Dr. Lakshmi P.",
            state="Karnataka"
        ),
        PHCDirectory(
            district="Mandya",
            sub_centre="Maddur",
            phc_name="Maddur General Hospital",
            phc_phone="08232-232555",
            medical_officer_name="Dr. Ramesh V.",
            state="Karnataka"
        ),
    ]

    with Session(engine) as session:
        for phc in phcs:
            session.add(phc)
        session.commit()
        print("Seeded 5 Karnataka PHCs.")

if __name__ == "__main__":
    seed_phcs()
