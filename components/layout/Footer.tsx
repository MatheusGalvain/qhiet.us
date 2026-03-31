import Link from 'next/link'
import { IoLogoInstagram } from "react-icons/io5";

const EXPLORE_LINKS = [
  { href: '/transmissoes', label: 'Transmissões' },
  { href: '/categorias', label: 'Categorias' },
  { href: '/ranking', label: 'Ranking' },
  { href: '/perfil', label: 'Perfil' },
]

const MEMBER_LINKS = [
  { href: '/membros', label: 'Planos' },
  { href: '/login', label: 'Entrar' },
  { href: '/login?tab=register', label: 'Criar conta' },
]

const HELP_LINKS = [
  { href: '/politica-de-privacidade', label: 'Política de Privacidade' },
  { href: '/politica-de-assinatura', label: 'Política de Assinatura' },
  { href: '/termos-de-uso', label: 'Termos de Uso' },
  { href: '/fale-conosco', label: 'Fale Conosco' },
]

export default function Footer() {
  return (
    <footer className="site-footer">
      <div className="footer-grid">
        {/* Col 1 — Logo + desc */}
        <div className="footer-col footer-col-brand">
          <p className="footer-wordmark">
            QHIETH<span style={{ color: 'var(--red)' }}>US</span>
          </p>
          <p className="footer-desc">
            Portal de conhecimentos gerais. Para os que buscam além do véu das aparências.
          </p>
          <p className="footer-est">◉ Est. MMXXVI</p>
        </div>
        
        {/* Col 2 — Explorar */}
        <div className="footer-col">
          <p className="footer-col-label">Explorar</p>
          {EXPLORE_LINKS.map(({ href, label }) => (
            <Link key={href} href={href} className="footer-link">
              {label}
            </Link>
          ))}
        </div>

        {/* Col 3 — Membros */}
        <div className="footer-col">
          <p className="footer-col-label">Membros</p>
          {MEMBER_LINKS.map(({ href, label }) => (
            <Link key={href} href={href} className="footer-link">
              {label}
            </Link>
          ))}
        </div>

        {/* Col 3 — Links Ajudantes */}
        <div className="footer-col">
          <p className="footer-col-label">Ajuda</p>
            {HELP_LINKS.map(({ href, label }) => (
              <Link key={href} href={href} className="footer-link">
                {label}
              </Link>
            ))}
        </div>
      </div>

      {/* Bottom bar */}
      <div className="footer-bottom">
        <p className="footer-copy">© QHIETHUS MMXXVI &nbsp;·&nbsp; ✦ &nbsp;◉&nbsp; ◈</p>
        <div className='flex gap-4'>
          <a
            href="https://www.instagram.com/qhiethus/"
            target="_blank"
            rel="noopener noreferrer"
            className="footer-instagram"
          >
            <IoLogoInstagram />
            Instagram
          </a>
        </div>
      </div>
    </footer>
  )
}
