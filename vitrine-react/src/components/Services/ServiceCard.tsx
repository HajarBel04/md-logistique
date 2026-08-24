import './ServiceCard.css';

interface ServiceCardProps {
  photoUrl: string;
  photoAlt: string;
  icon: React.ReactNode;
  title: string;
  description: string;
}

export default function ServiceCard({ photoUrl, photoAlt, icon, title, description }: ServiceCardProps) {
  return (
    <article className="svc-card">
      {/* Photo */}
      <div className="svc-card__photo">
        <img src={photoUrl} alt={photoAlt} loading="lazy" />
      </div>

      {/* Content */}
      <div className="svc-card__body">
        <span className="svc-card__icon">{icon}</span>
        <h3 className="svc-card__title">{title}</h3>
        <p className="svc-card__desc">{description}</p>

        {/* Circle arrow */}
        <button className="svc-card__arrow" aria-label={`En savoir plus sur ${title}`}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
               stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
            <path d="M5 12h14M12 5l7 7-7 7"/>
          </svg>
        </button>
      </div>
    </article>
  );
}
