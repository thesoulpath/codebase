import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// This object contains all the default English and Spanish content for your website.
const contentToSeed = {
  en: {
    nav: {
      invitation: "The Invitation",
      approach: "The Approach", 
      session: "The Session",
      about: "About José",
      apply: "Book",
      login: "Admin"
    },
    hero: {
      title: "Your Cosmic Blueprint Awaits.",
      subtitle: "Strategic astrological counsel to navigate your life's most pivotal moments. This is where your path meets your purpose.",
      scrollDown: "Scroll Down"
    },
    approach: {
      title: "Beyond Prediction. Pure Strategy.",
      items: [
        {
          title: "Decode Your Core.",
          text: "We analyze your Natal Chart—the sacred map of your potential, strengths, and life lessons, imprinted at the moment of your birth."
        },
        {
          title: "Master Your Timing.",
          text: "We examine your Transits—the current planetary movements activating your chart, revealing opportunities and challenges."
        },
        {
          title: "Align With Your Path.",
          text: "We synthesize this cosmic data into clear, actionable guidance focused on your unique journey forward."
        }
      ]
    },
    session: {
      title: "The Soul Compass Session",
      price: "$130 USD",
      description: "A confidential, 90-minute deep-dive consultation and subsequent written analysis to provide you with profound strategic clarity.",
      deliverables: [
        "90-Minute Live Consultation",
        "Personalized Written Chart Analysis (PDF)",
        "Full Session Audio Recording"
      ],
      cta: "Begin Your Journey"
    },
    about: {
      title: "José Garfias - Your Cosmic Navigator",
      text: "My mission is to translate the complex language of the stars into a practical tool for modern leaders and seekers. With years of advising a private clientele, I provide a space of confidentiality, depth, and strategic insight. Your soul has a map; I am here to help you read it."
    },
    apply: {
      title: "Book Your Session",
      subtitle: "Please provide your birth data with precision. All information is encrypted and confidential. We will respond within 48 hours.",
      form: {
        name: "Full Name",
        email: "Email Address",
        birthDate: "Date of Birth",
        birthTime: "Exact Time of Birth",
        birthPlace: "City/Country of Birth",
        question: "Your Core Question",
        questionPlaceholder: "What area of your life would you like cosmic guidance on?",
        submit: "Confirm Booking",
        thankYou: "Your cosmic session has been successfully booked! We will send confirmation details shortly."
      }
    },
    cta: {
      bookReading: "Book your reading"
    }
  },
  es: {
    nav: {
      invitation: "La Invitación",
      approach: "El Enfoque",
      session: "La Sesión", 
      about: "Sobre José",
      apply: "Reservar",
      login: "Admin"
    },
    hero: {
      title: "Tu Plan Cósmico te Espera.",
      subtitle: "Asesoría astrológica estratégica para navegar los momentos más cruciales de tu vida. Aquí es donde tu camino se encuentra con tu propósito.",
      scrollDown: "Desplázate"
    },
    approach: {
      title: "Más Allá de la Predicción. Pura Estrategia.",
      items: [
        {
          title: "Descifra tu Esencia.",
          text: "Analizamos tu Carta Natal—el mapa sagrado de tu potencial, fortalezas y lecciones de vida, impreso en el momento de tu nacimiento."
        },
        {
          title: "Domina tu Tiempo.",
          text: "Examinamos tus Tránsitos—los movimientos planetarios actuales que activan tu carta, revelando oportunidades y desafíos."
        },
        {
          title: "Alíneate con tu Camino.",
          text: "Sintetizamos estos datos cósmicos en una guía clara y accionable, enfocada en tu viaje único hacia adelante."
        }
      ]
    },
    session: {
      title: "La Sesión Brújula del Alma",
      price: "S/. 500",
      description: "Una consulta confidencial de 90 minutos y un posterior análisis escrito para brindarte una profunda claridad estratégica.",
      deliverables: [
        "Consulta en Vivo de 90 Minutos",
        "Análisis Escrito y Personalizado de tu Carta (PDF)",
        "Grabación Completa en Audio de la Sesión"
      ],
      cta: "Comienza Tu Viaje"
    },
    about: {
      title: "José Garfias - Tu Navegante Cósmico",
      text: "Mi misión es traducir el complejo lenguaje de las estrellas en una herramienta práctica para líderes y buscadores modernos. Con años de experiencia asesorando a una clientela privada, ofrezco un espacio de confidencialidad, profundidad y visión estratégica. Tu alma tiene un mapa; estoy aquí para ayudarte a leerlo."
    },
    apply: {
      title: "Reserva tu Sesión",
      subtitle: "Por favor, proporciona tus datos de nacimiento con precisión. Toda la información está encriptada y es confidencial. Responderemos en 48 horas.",
      form: {
        name: "Nombre Completo",
        email: "Correo Electrónico",
        birthDate: "Fecha de Nacimiento",
        birthTime: "Hora Exacta de Nacimiento",
        birthPlace: "Ciudad/País de Nacimiento",
        question: "Tu Pregunta Principal",
        questionPlaceholder: "¿En qué área de tu vida te gustaría recibir guía cósmica?",
        submit: "Confirmar Reserva",
        thankYou: "¡Tu sesión cósmica ha sido reservada exitosamente! Te enviaremos los detalles de confirmación pronto."
      }
    },
    cta: {
      bookReading: "Reserva tu lectura"
    }
  }
};

export async function POST() {
  try {
    console.log('Seeding content into the database...');

    // First, try to insert into the content table
    const { error: contentError } = await supabase
      .from('content')
      .upsert({ 
        id: 1,
        content: contentToSeed,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }, { onConflict: 'id' });

    if (contentError) {
      console.error('Error seeding content table:', contentError);
      
      // If content table doesn't exist, try the kv_store approach
      try {
        const { error: kvError } = await supabase
          .from('kv_store_f839855f')
          .upsert({ 
            key: 'cms_content', 
            value: contentToSeed 
          });

        if (kvError) {
          console.error('Error seeding kv_store:', kvError);
          return NextResponse.json({ 
            message: 'Failed to seed content. Neither content table nor kv_store table found.' 
          }, { status: 500 });
        }

        console.log('✅ Content seeded successfully into kv_store!');
        return NextResponse.json({ 
          message: 'Content seeded successfully into kv_store',
          method: 'kv_store'
        });
      } catch (kvError) {
        console.error('Unexpected error with kv_store:', kvError);
        return NextResponse.json({ 
          message: 'Failed to seed content into kv_store' 
        }, { status: 500 });
      }
    }

    console.log('✅ Content seeded successfully into content table!');
    return NextResponse.json({ 
      message: 'Content seeded successfully into content table',
      method: 'content_table'
    });

  } catch (error) {
    console.error('Unexpected error seeding content:', error);
    return NextResponse.json({ 
      message: 'Internal server error while seeding content' 
    }, { status: 500 });
  }
}
