# Pesito a Pesito - Asistente Financiero con IA

Pesito a Pesito es una plataforma SaaS que proporciona información bursátil en tiempo real, gráficos interactivos, datos financieros y análisis de mercado a través de un chatbot potenciado por inteligencia artificial.

## Características

- **Asistente financiero con IA**: Obtén datos financieros y análisis al instante
- **Datos de mercado en tiempo real**: Potenciado por widgets de TradingView
- **Autenticación de usuarios**: Inicio de sesión seguro con Clerk
- **Niveles de suscripción**: Planes Gratuito y Premium
- **Pagos con DeFi**: Sistema de pagos con criptomonedas en la red de pruebas Sepolia
- **Historial de mensajes**: Guarda y consulta conversaciones anteriores (solo Premium)
- **Diseño responsivo**: Funciona en todos los dispositivos

## Stack Tecnológico

- **Frontend**: Next.js 14, React, TypeScript, Tailwind CSS
- **Backend**: API Routes de Next.js, Prisma ORM
- **Base de datos**: SQLite (desarrollo), PostgreSQL (recomendado para producción)
- **Autenticación**: Clerk
- **IA**: Groq AI API (modelo Llama3-70b)
- **Datos Financieros**: Widgets de TradingView
- **Suscripciones**: Integración DeFi (contratos inteligentes en Sepolia)

## Primeros Pasos

### Requisitos Previos

- Node.js 18+ y npm/yarn/pnpm
- Clave API de Groq
- Cuenta de Clerk
- MetaMask para transacciones en testnet

### Instalación

1. Clona el repositorio:

   ```bash
   git clone https://github.com/tuusuario/pesito-a-pesito.git
   cd pesito-a-pesito
   ```

2. Instala dependencias:

   ```bash
   npm install
   # o
   yarn install
   # o
   pnpm install
   ```

3. Configura las variables de entorno:

   - Copia `.env.example` a `.env.local`
   - Llena los valores requeridos:
     - `GROQ_API_KEY`: Tu clave API de Groq
     - `DATABASE_URL`: URL de conexión a tu base de datos
     - `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`: Clave pública de Clerk
     - `CLERK_SECRET_KEY`: Clave secreta de Clerk
     - `NEXT_PUBLIC_CONTRACT_ADDRESS`: Dirección del contrato desplegado (si usas DeFi)

4. Inicializa la base de datos:

   ```bash
   npm run db:init
   # o
   yarn db:init
   # o
   pnpm db:init
   ```

5. Inicia el servidor de desarrollo:

   ```bash
   npm run dev
   # o
   yarn dev
   # o
   pnpm dev
   ```

6. Abre [http://localhost:3000](http://localhost:3000) en tu navegador.

## Planes de Suscripción

### Plan Gratuito

- Acceso al asistente financiero básico con IA
- Limitado a 3 mensajes por conversación
- Sin historial de conversaciones

### Plan Premium

- Mensajes ilimitados
- Historial de conversaciones guardado
- Soporte prioritario
- Datos financieros y análisis mejorados

## Estructura del Proyecto

```
├── app/               # Router de App de Next.js
├── components/        # Componentes de React
├── contracts/         # Contratos inteligentes para suscripciones
├── lib/               # Funciones de utilidad y hooks
│   ├── chat/          # Funcionalidad de chat con IA
│   ├── hooks/         # Hooks personalizados de React
│   ├── store/         # Gestión de estado
│   ├── web3/          # Utilidades para integración blockchain
│   └── types.ts       # Tipos de TypeScript
├── prisma/            # Esquema de base de datos y migraciones
├── public/            # Activos estáticos
└── scripts/           # Scripts de utilidad
```

## Desarrollo

### Gestión de Base de Datos

- Abre Prisma Studio para gestionar tu base de datos:

  ```bash
  npm run db:studio
  # o
  yarn db:studio
  # o
  pnpm db:studio
  ```

- Crea una nueva migración después de cambios en el esquema:
  ```bash
  npm run db:migrate
  # o
  yarn db:migrate
  # o
  pnpm db:migrate
  ```

### Contrato Inteligente

- Compila el contrato:

  ```bash
  npm run contract:compile
  ```

- Despliega el contrato en Sepolia:

  ```bash
  npm run contract:deploy
  ```

- Verifica el contrato en Etherscan:
  ```bash
  npm run contract:verify
  ```

### Linting y Formateo

```bash
# Ejecutar linter
npm run lint

# Arreglar problemas de linting
npm run lint:fix

# Formatear código
npm run format:write
```

## Despliegue

### Vercel

1. Sube tu código a GitHub
2. Importa tu repositorio en Vercel
3. Configura las variables de entorno requeridas
4. Despliega

### Otras Plataformas

1. Construye la aplicación:

   ```bash
   npm run build
   # o
   yarn build
   # o
   pnpm build
   ```

2. Inicia el servidor:
   ```bash
   npm run start
   # o
   yarn start
   # o
   pnpm start
   ```

## Contribuir

1. Haz un fork del repositorio
2. Crea tu rama de características (`git checkout -b feature/caracteristica-increible`)
3. Haz commit de tus cambios (`git commit -m 'Agrega alguna característica increíble'`)
4. Haz push a la rama (`git push origin feature/caracteristica-increible`)
5. Abre un Pull Request

---

Desarrollado con ❤️ por Álvaro Zaid Gallardo Hernández
