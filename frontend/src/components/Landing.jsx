import { Link } from "react-router-dom";
import {
  Zap,
  BarChart3,
  Brain,
  Moon,
  Sun,
  Globe,
  ShieldCheck,
  Quote,
  Fingerprint,
  Sparkles,
} from "lucide-react";
import { useTheme } from "../contexts/ThemeContext";
import { useState, useEffect } from "react";
import "../styles/Landing_theme.css";

export default function Landing() {
  const { isDark, toggleTheme } = useTheme();
  const [scrolled, setScrolled] = useState(false);

  // Handle scroll effect for navigation
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <div className="landing">
      {/* Navigation */}
      <nav className={`landing-nav ${scrolled ? "nav-scrolled" : ""}`}>
        <Link to="/" className="nav-brand">
          <Globe className="brand-icon" />
          <span className="brand-text">EcoAgent</span>
        </Link>

        <div className="nav-right">
          <button
            className="theme-toggle"
            onClick={toggleTheme}
            aria-label="Toggle theme"
          >
            {isDark ? <Sun size={20} /> : <Moon size={20} />}
          </button>
          <Link to="/dashboard" className="nav-dashboard">
            Dashboard
          </Link>
        </div>
      </nav>

      {/* Hero Section 11*/}
      <section className="landing-hero">
        <div className="bg-gradient-1"></div>
        <div className="bg-gradient-2"></div>

        <div className="hero-centered">
          <div className="hero-badge">
            <Zap size={14} />
            <span>AI-Powered Sustainability</span>
          </div>

          <h1 className="hero-headline-large">
            The future of
            <br />
            <span className="text-white">sustainability</span> is <br />
            <span className="text-white">
              <Fingerprint
                className="inline-icon"
                size={60}
                strokeWidth={2.5}
              />
              human
            </span>{" "}
            +{" "}
            <span className="text-white">
              <Sparkles className="inline-icon" size={60} strokeWidth={2.5} />
              AI
            </span>
          </h1>

          <p className="hero-subscribtion">
            We help you map the carbon footprint you create, track the energy
            you save, and close your gaps to thrive in a Net Zero world.
          </p>

          <div className="hero-actions">
            <Link to="/dashboard" className="glow-button">
              Go to Dashboard 🛩️
            </Link>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="section-stats">
        <div className="stats-container">
          <div className="stat-item">
            <h3>2.4M+</h3>
            <p>kWh Energy Saved</p>
          </div>
          <div className="stat-item">
            <h3>98%</h3>
            <p>Accuracy Rate</p>
          </div>
          <div className="stat-item">
            <h3>500+</h3>
            <p>Enterprise Partners</p>
          </div>
          <div className="stat-item">
            <h3>24/7</h3>
            <p>Real-time Monitoring</p>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="section-features" id="features">
        <div className="section-header">
          <span className="section-label">Features</span>
          <h2 className="section-title">Everything you need to optimize</h2>
          <p className="section-desc">
            Comprehensive tools and insights designed to help your organization
            achieve net-zero goals efficiently.
          </p>
        </div>

        <div className="features-grid">
          <div className="feature-card">
            <div className="feature-icon-wrapper">
              <BarChart3 size={28} />
            </div>
            <h3 className="feature-title">Real-time Analytics</h3>
            <p className="feature-text">
              Monitor energy consumption patterns across all your facilities in
              real-time with granular data visualization.
            </p>
          </div>

          <div className="feature-card">
            <div className="feature-icon-wrapper">
              <Brain size={28} />
            </div>
            <h3 className="feature-title">AI Optimization</h3>
            <p className="feature-text">
              Autonomous agents analyze usage patterns to suggest and implement
              energy-saving optimizations automatically.
            </p>
          </div>

          <div className="feature-card">
            <div className="feature-icon-wrapper">
              <ShieldCheck size={28} />
            </div>
            <h3 className="feature-title">Compliance Reports</h3>
            <p className="feature-text">
              Generate audit-ready environmental impact reports compliant with
              global sustainability standards (ESG, ISO).
            </p>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="section-how">
        <div className="section-header">
          <span className="section-label">Process</span>
          <h2 className="section-title">How EcoAgent Works</h2>
          <p className="section-desc">
            Seamless integration and intelligent automation in three simple
            steps.
          </p>
        </div>

        <div className="steps-grid">
          <div className="step-card">
            <div className="step-number">1</div>
            <h3 className="step-title">Connect Sources</h3>
            <p className="step-text">
              Integrate with your smart meters, IoT devices, and existing
              building management systems securely.
            </p>
          </div>

          <div className="step-card">
            <div className="step-number">2</div>
            <h3 className="step-title">AI Analysis</h3>
            <p className="step-text">
              Our advanced algorithms analyze consumption patterns to identify
              inefficiencies and waste.
            </p>
          </div>

          <div className="step-card">
            <div className="step-number">3</div>
            <h3 className="step-title">Auto-Optimize</h3>
            <p className="step-text">
              Apply AI-driven recommendations automatically or with approval to
              instantly reduce costs.
            </p>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="section-testimonials">
        <div className="section-header">
          <span className="section-label">Trust</span>
          <h2 className="section-title">Trusted by Leaders</h2>
          <p className="section-desc">
            See how forward-thinking companies are revolutionizing their
            sustainability efforts.
          </p>
        </div>

        <div className="testimonials-grid">
          <div className="testimonial-card">
            <Quote className="quote-icon" size={32} />
            <p className="testimonial-text">
              "EcoAgent cut our energy costs by 22% in the first quarter alone.
              The AI insights are game-changing for our facility management."
            </p>
            <div className="testimonial-author">
              <div className="author-avatar" />
              <div className="author-info">
                <h4>Sarah Jenkins</h4>
                <p>CTO, TechFlow Inc.</p>
              </div>
            </div>
          </div>

          <div className="testimonial-card">
            <Quote className="quote-icon" size={32} />
            <p className="testimonial-text">
              "Finally, a platform that makes ESG reporting automated and
              accurate. We saved hundreds of hours on compliance documentation."
            </p>
            <div className="testimonial-author">
              <div className="author-avatar" />
              <div className="author-info">
                <h4>Michael Chen</h4>
                <p>Director of Ops, FutureBuild</p>
              </div>
            </div>
          </div>

          <div className="testimonial-card">
            <Quote className="quote-icon" size={32} />
            <p className="testimonial-text">
              "The predictive maintenance alerts helped us prevent a major HVAC
              failure. The ROI on this platform is undeniable."
            </p>
            <div className="testimonial-author">
              <div className="author-avatar" />
              <div className="author-info">
                <h4>Robert Almada</h4>
                <p>Facility Manager, Apex Towers</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="landing-footer">
        <div className="footer-content">
          <div className="footer-main">
            <Link to="/" className="footer-logo">
              EcoAgent
            </Link>
            <p className="footer-desc">
              Empowering enterprises to build a sustainable future through
              intelligent energy management and AI-driven insights.
            </p>
          </div>

          <div className="footer-column">
            <h4>Platform</h4>
            <Link to="/dashboard">Dashboard</Link>
            <a href="#">Analytics</a>
            <a href="#">Reporting</a>
            <a href="#">API</a>
          </div>

          <div className="footer-column">
            <h4>Company</h4>
            <a href="#">About Us</a>
            <a href="#">Careers</a>
            <a href="#">Blog</a>
            <a href="#">Contact</a>
          </div>

          <div className="footer-column">
            <h4>Connect</h4>
            <a href="#">Twitter</a>
            <a href="#">LinkedIn</a>
            <a href="#">GitHub</a>
            <a href="#">Discord</a>
          </div>
        </div>

        <div className="footer-bottom">
          <p>
            &copy; {new Date().getFullYear()} EcoAgent Inc. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
