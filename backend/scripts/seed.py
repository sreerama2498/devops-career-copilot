import asyncio
from app.db.session import get_engine, get_session_factory
from app.models.models import User, CandidateProfile, Job, JobSource
from app.core.security import hash_password

SAMPLE_JOBS = [
    {"external_id":"remoteok-001","source":JobSource.remoteok,"title":"Staff Site Reliability Engineer","company":"Stripe","location":"Remote (US/EU)","is_remote":True,"salary_min":220000,"salary_max":260000,"currency":"USD","required_skills":["Kubernetes","Terraform","AWS","Go","FinOps"],"url":"https://remoteok.com/jobs/001","description":"Join Stripe SRE team."},
    {"external_id":"remoteok-002","source":JobSource.remoteok,"title":"Senior Platform Engineer","company":"Datadog","location":"New York / Remote","is_remote":True,"salary_min":190000,"salary_max":230000,"currency":"USD","required_skills":["AWS","Golang","Kubernetes","Cilium","Prometheus"],"url":"https://remoteok.com/jobs/002","description":"Build the internal platform."},
    {"external_id":"wellfound-001","source":JobSource.wellfound,"title":"DevOps Lead","company":"HashiCorp","location":"Remote (Global)","is_remote":True,"salary_min":180000,"salary_max":210000,"currency":"USD","required_skills":["Terraform","Vault","Nomad","AWS","GCP"],"url":"https://wellfound.com/jobs/001","description":"Lead DevOps at HashiCorp."},
]

async def seed():
    engine = get_engine()
    sf = get_session_factory(engine)
    async with sf() as session:
        user = User(email="alex@example.com", hashed_password=hash_password("devops123"), full_name="Alex Kumar")
        session.add(user); await session.flush()
        session.add(CandidateProfile(user_id=user.id, title="Senior DevOps Engineer", years_experience=7, location="Remote", remote_preference="remote", skills=["Kubernetes","Terraform","AWS","Python","Prometheus","Grafana"], salary_min=180000, salary_max=250000))
        for j in SAMPLE_JOBS: session.add(Job(**j))
        await session.commit()
    print("✓ Seeded: alex@example.com / devops123")
    print(f"✓ {len(SAMPLE_JOBS)} sample jobs inserted")
    await engine.dispose()

if __name__ == "__main__": asyncio.run(seed())
