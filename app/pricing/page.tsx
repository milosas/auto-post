'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

type BillingInterval = 'monthly' | 'annual';

export default function PricingPage() {
  const router = useRouter();
  const [interval, setInterval] = useState<BillingInterval>('monthly');
  const [loading, setLoading] = useState<string | null>(null);

  const handleSubscribe = async (priceId: string) => {
    setLoading(priceId);
    try {
      // Check authentication
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        // Redirect to sign-in
        router.push('/sign-in?redirect=/pricing');
        return;
      }

      // Call checkout API
      const response = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ priceId }),
      });

      if (!response.ok) {
        const error = await response.json();
        alert(`Klaida: ${error.error || 'Nepavyko sukurti atsiskaitymo sesijos'}`);
        return;
      }

      const { url } = await response.json();
      if (url) {
        window.location.href = url;
      }
    } catch (error) {
      console.error('Error starting checkout:', error);
      alert('Įvyko klaida. Bandykite dar kartą.');
    } finally {
      setLoading(null);
    }
  };

  const handleBuyCredits = async (packageId: '10' | '30' | '100') => {
    setLoading(`credits-${packageId}`);
    try {
      // Check authentication
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        // Redirect to sign-in
        router.push('/sign-in?redirect=/pricing');
        return;
      }

      // Call credits API
      const response = await fetch('/api/stripe/credits', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ packageId }),
      });

      if (!response.ok) {
        const error = await response.json();
        alert(`Klaida: ${error.error || 'Nepavyko sukurti atsiskaitymo sesijos'}`);
        return;
      }

      const { url } = await response.json();
      if (url) {
        window.location.href = url;
      }
    } catch (error) {
      console.error('Error buying credits:', error);
      alert('Įvyko klaida. Bandykite dar kartą.');
    } finally {
      setLoading(null);
    }
  };

  // Price IDs from env vars (would be set in .env.local)
  const prices = {
    starter: {
      monthly: process.env.NEXT_PUBLIC_STRIPE_PRICE_STARTER_MONTHLY || '',
      annual: process.env.NEXT_PUBLIC_STRIPE_PRICE_STARTER_ANNUAL || '',
    },
    pro: {
      monthly: process.env.NEXT_PUBLIC_STRIPE_PRICE_PRO_MONTHLY || '',
      annual: process.env.NEXT_PUBLIC_STRIPE_PRICE_PRO_ANNUAL || '',
    },
    unlimited: {
      monthly: process.env.NEXT_PUBLIC_STRIPE_PRICE_UNLIMITED_MONTHLY || '',
      annual: process.env.NEXT_PUBLIC_STRIPE_PRICE_UNLIMITED_ANNUAL || '',
    },
  };

  const subscriptionPlans = [
    {
      name: 'Starter',
      priceMonthly: '€9',
      priceAnnual: '€90',
      priceIdMonthly: prices.starter.monthly,
      priceIdAnnual: prices.starter.annual,
      features: ['30 generacijų per mėnesį'],
      popular: false,
    },
    {
      name: 'Pro',
      priceMonthly: '€19',
      priceAnnual: '€190',
      priceIdMonthly: prices.pro.monthly,
      priceIdAnnual: prices.pro.annual,
      features: [
        '70 generacijų per mėnesį',
        'Prioritetinė pagalba',
      ],
      popular: true,
    },
    {
      name: 'Unlimited',
      priceMonthly: '€49',
      priceAnnual: '€490',
      priceIdMonthly: prices.unlimited.monthly,
      priceIdAnnual: prices.unlimited.annual,
      features: [
        'Neribota generacijų',
        'Prioritetinė pagalba',
        'Ankstyvasis funkcijų priėjimas',
      ],
      popular: false,
    },
  ];

  const creditPackages = [
    {
      credits: 10,
      price: '€5',
      perCredit: '€0.50',
      packageId: '10' as const,
    },
    {
      credits: 30,
      price: '€12',
      perCredit: '€0.40',
      packageId: '30' as const,
    },
    {
      credits: 100,
      price: '€35',
      perCredit: '€0.35',
      packageId: '100' as const,
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 py-12 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Kainoraštis</h1>
          <p className="text-lg text-gray-600 mb-8">
            Pasirinkite planą, kuris atitinka jūsų poreikius
          </p>

          {/* Billing interval toggle */}
          <div className="inline-flex items-center gap-3 bg-white rounded-full p-1 shadow-sm">
            <button
              onClick={() => setInterval('monthly')}
              className={`px-6 py-2 rounded-full font-medium transition-all ${
                interval === 'monthly'
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Kas mėnesį
            </button>
            <button
              onClick={() => setInterval('annual')}
              className={`px-6 py-2 rounded-full font-medium transition-all ${
                interval === 'annual'
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Kas metus
              <span className="ml-2 text-xs text-green-600 font-semibold">
                2 mėnesiai nemokamai
              </span>
            </button>
          </div>
        </div>

        {/* Subscription plans grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
          {subscriptionPlans.map((plan) => {
            const priceId =
              interval === 'monthly' ? plan.priceIdMonthly : plan.priceIdAnnual;
            const price =
              interval === 'monthly' ? plan.priceMonthly : plan.priceAnnual;
            const isLoading = loading === priceId;

            return (
              <div
                key={plan.name}
                className={`relative bg-white rounded-2xl shadow-lg p-8 ${
                  plan.popular ? 'ring-2 ring-blue-600' : ''
                }`}
              >
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                    <span className="bg-blue-600 text-white px-4 py-1 rounded-full text-sm font-semibold">
                      Populiariausias
                    </span>
                  </div>
                )}

                <div className="mb-6">
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">
                    {plan.name}
                  </h3>
                  <div className="flex items-baseline gap-1">
                    <span className="text-4xl font-bold text-gray-900">
                      {price}
                    </span>
                    <span className="text-gray-600">
                      /{interval === 'monthly' ? 'mėn' : 'metus'}
                    </span>
                  </div>
                </div>

                <ul className="space-y-3 mb-8">
                  {plan.features.map((feature, idx) => (
                    <li key={idx} className="flex items-start gap-3">
                      <svg
                        className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                          clipRule="evenodd"
                        />
                      </svg>
                      <span className="text-gray-700">{feature}</span>
                    </li>
                  ))}
                </ul>

                <button
                  onClick={() => handleSubscribe(priceId)}
                  disabled={isLoading || !priceId}
                  className={`w-full py-3 px-6 rounded-lg font-semibold transition-all ${
                    plan.popular
                      ? 'bg-blue-600 hover:bg-blue-700 text-white'
                      : 'bg-gray-100 hover:bg-gray-200 text-gray-900'
                  } disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  {isLoading ? 'Kraunasi...' : 'Prenumeruoti'}
                </button>
              </div>
            );
          })}
        </div>

        {/* Divider */}
        <div className="relative mb-16">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-300" />
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-4 bg-gradient-to-br from-blue-50 via-white to-purple-50 text-gray-600 font-medium">
              Arba pirkite kreditų vienkartiniam naudojimui
            </span>
          </div>
        </div>

        {/* Credit packages */}
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-gray-900 text-center mb-8">
            Kreditų paketai
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {creditPackages.map((pkg) => {
              const loadingKey = `credits-${pkg.packageId}`;
              const isLoading = loading === loadingKey;

              return (
                <div
                  key={pkg.credits}
                  className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition-shadow"
                >
                  <div className="text-center mb-4">
                    <div className="text-5xl font-bold text-blue-600 mb-2">
                      {pkg.credits}
                    </div>
                    <div className="text-gray-600 text-sm">kreditų</div>
                  </div>

                  <div className="text-center mb-4">
                    <div className="text-2xl font-bold text-gray-900 mb-1">
                      {pkg.price}
                    </div>
                    <div className="text-sm text-gray-500">
                      {pkg.perCredit} už kreditą
                    </div>
                  </div>

                  <button
                    onClick={() => handleBuyCredits(pkg.packageId)}
                    disabled={isLoading}
                    className="w-full py-3 px-6 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white rounded-lg font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isLoading ? 'Kraunasi...' : 'Pirkti'}
                  </button>
                </div>
              );
            })}
          </div>

          <div className="mt-8 text-center text-sm text-gray-600">
            <p>
              Kreditai galioja neribotą laiką ir gali būti naudojami bet kada.
            </p>
            <p className="mt-1">
              Nereikia prenumeratos - mokėkite tik tada, kai reikia.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
