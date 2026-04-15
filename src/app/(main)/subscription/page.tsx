'use client';

import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from '@/lib/i18n';
import { useUser } from '@/hooks/useUser';
import Spinner from '@/components/ui/Spinner';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import PaymentModal from '@/components/PaymentModal';
import PromotionDetailModal, {
  formatCredits,
  getPromotionStrings,
} from '@/components/PromotionDetailModal';
import { SUBSCRIPTION_PRICE_CENTS } from '@/config/subscription';
import type { UserPromotion } from '@/lib/db/queries/promotions';

export default function SubscriptionPage() {
  const { t, language } = useTranslation();
  const { user, loading, refetch } = useUser();
  const [paymentOpen, setPaymentOpen] = useState(false);
  const [promotions, setPromotions] = useState<UserPromotion[] | null>(null);
  const [promotionsError, setPromotionsError] = useState(false);
  const [selectedPromotion, setSelectedPromotion] = useState<UserPromotion | null>(null);
  const [promoDismissed, setPromoDismissed] = useState(false);
  const [subscribeDismissed, setSubscribeDismissed] = useState(false);

  function handleDismissPromo(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    setPromoDismissed(true);
  }

  function handleDismissSubscribe(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    setSubscribeDismissed(true);
  }

  const loadPromotions = useCallback(async () => {
    try {
      const res = await fetch('/api/promotions');
      if (!res.ok) throw new Error();
      const data: UserPromotion[] = await res.json();
      setPromotions(data);
      setPromotionsError(false);
    } catch {
      setPromotionsError(true);
    }
  }, []);

  useEffect(() => {
    loadPromotions();
  }, [loadPromotions]);

  const handlePromotionClaimed = useCallback(() => {
    loadPromotions();
    refetch();
  }, [loadPromotions, refetch]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-[calc(100vh-5.5rem)]">
        <Spinner size={28} />
        <p className="mt-3 text-sm text-muted-text">{t.section.loading}</p>
      </div>
    );
  }

  if (!user) return null;

  const isFree = user.plan === 'free';
  const isPro = user.plan === 'pro';
  const priceFormatted = 'R$' + (SUBSCRIPTION_PRICE_CENTS / 100).toFixed(2);
  const balanceFormatted = 'R$' + (user.balance / 100).toFixed(2);
  const expiresFormatted = user.planExpiresAt
    ? new Date(user.planExpiresAt).toLocaleDateString(language === 'pt-BR' ? 'pt-BR' : 'en-US')
    : '';

  return (
    <div className="flex flex-col min-h-[calc(100vh-5.5rem)] pb-16 max-w-4xl mx-auto w-full px-4 sm:px-6">
      {/* Hero Header */}
      <div className="text-center py-10 lg:py-14 animate-[fade-in-up_0.4s_ease-out_forwards]">
        <h1 className="text-3xl lg:text-4xl font-semibold tracking-tight text-primary-text mb-3">
          {t.subscription.choosePlan}
        </h1>
        <p className="text-[15px] sm:text-base text-muted-text max-w-lg mx-auto">
          {t.subscription.choosePlanSubtitle}
        </p>
      </div>

      {/* Pro Banner */}
      {isPro && (
        <div className="mb-8 p-4 rounded-xl bg-surface/50 border border-border-subtle flex items-center justify-center gap-2 animate-[fade-in-up_0.5s_ease-out_0.1s_forwards] opacity-0 text-primary-text text-sm font-medium">
          <svg className="w-4 h-4 text-accent-blue flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          <span className="text-center">{t.subscription.proUntil.replace('{date}', expiresFormatted)}</span>
        </div>
      )}

      {/* Pricing Cards (Side-by-side but simple) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
        {/* Free plan card */}
        <div className={`flex flex-col p-8 rounded-2xl bg-surface/30 border ${isFree ? 'border-accent-blue/40 ring-1 ring-accent-blue/10 bg-accent-blue/[0.02]' : 'border-border-subtle'} animate-[fade-in-up_0.6s_ease-out_0.2s_forwards] opacity-0`}>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-primary-text">{t.subscription.freePlan}</h2>
            {isFree && <Badge variant="blue">{t.subscription.currentPlan}</Badge>}
          </div>
          <p className="text-4xl font-semibold text-primary-text mb-6">
            R$0<span className="text-sm text-muted-text ml-1 font-medium">/{t.subscription.perMonth}</span>
          </p>
          <ul className="space-y-4 mb-8 flex-1">
            {t.subscription.featuresFree.map((feature, i) => (
              <li key={i} className="flex items-start gap-3 text-sm text-muted-text">
                <svg className="w-4 h-4 text-muted-text shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span>{feature}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Pro plan card */}
        <div className={`flex flex-col p-8 rounded-2xl bg-surface/60 border ${isPro ? 'border-accent-blue/50 ring-1 ring-accent-blue/20' : 'border-border-subtle'} animate-[fade-in-up_0.6s_ease-out_0.3s_forwards] opacity-0 relative overflow-hidden`}>
          <div className="absolute top-0 right-0 pt-6 pr-8">
             <div className="inline-flex items-center text-xs font-medium text-accent-blue">
               {t.subscription.recommended}
             </div>
          </div>
          
          <div className="flex items-center justify-between mb-4 mt-1">
            <h2 className="text-lg font-semibold text-primary-text">{t.subscription.proPlan}</h2>
            {isPro && <Badge variant="blue" className="mr-24">{t.subscription.currentPlan}</Badge>}
          </div>
          <p className="text-4xl font-semibold text-primary-text mb-6">
            {priceFormatted}
            <span className="text-sm font-medium text-muted-text ml-1">/{t.subscription.perMonth}</span>
          </p>
          <ul className="space-y-4 mb-8 flex-1">
            {t.subscription.featuresPro.map((feature, i) => (
              <li key={i} className="flex items-start gap-3 text-sm text-primary-text">
                <svg className="w-4 h-4 text-accent-blue shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span>{feature}</span>
              </li>
            ))}
          </ul>
          <div className="mt-auto relative z-10 w-full">
            {isFree ? (
              <div className="relative w-full">
                {user.balance >= SUBSCRIPTION_PRICE_CENTS && !subscribeDismissed && (
                  <div className="absolute bottom-[130%] left-1/2 -translate-x-1/2 mb-2 w-64 p-3.5 rounded-2xl bg-gradient-to-br from-success-green/20 to-surface border border-success-green/30 backdrop-blur-xl shadow-[0_8px_30px_rgb(0,0,0,0.3)] animate-[fade-in-up_0.4s_ease-out_forwards]" onClick={(e) => e.stopPropagation()}>
                    <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-3 h-3 bg-surface border-b border-r border-success-green/30 transform rotate-45" />
                    <div className="flex items-start justify-between gap-3 relative">
                      <div className="w-7 h-7 rounded-full bg-success-green/20 flex items-center justify-center text-success-green shrink-0">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                           <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                      <span className="text-[13px] font-medium text-primary-text leading-snug">{t.promotions.claimTooltipSubscribe}</span>
                      <button onClick={handleDismissSubscribe} className="shrink-0 text-muted-text hover:text-primary-text transition-colors mt-0.5 cursor-pointer" aria-label="Close">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M18 6L6 18M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  </div>
                )}
                <Button onClick={() => setPaymentOpen(true)} className="w-full py-2.5 shadow-sm">{t.subscription.subscribe}</Button>
              </div>
            ) : (
              <div className="flex items-center justify-center text-sm font-medium text-primary-text bg-background border border-border-subtle rounded-full py-2.5 w-full">
                {t.subscription.youAreNowPro}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="h-px bg-border-subtle/50 my-6 w-full animate-[fade-in-up_0.6s_ease-out_0.35s_forwards] opacity-0" />

      {/* Dashboard-like bottom section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 animate-[fade-in-up_0.6s_ease-out_0.4s_forwards] opacity-0">
        
        {/* Wallet area */}
        <div className="flex flex-col gap-4">
           <h2 className="text-sm font-semibold tracking-wide text-muted-text uppercase">{t.subscription.walletTitle}</h2>
           <Card className="flex flex-col p-6 h-full justify-center">
             <p className="text-[13px] text-muted-text mb-1 uppercase tracking-wider">{t.subscription.yourBalance.replace('{amount}', '').replace(':', '').trim()}</p>
             <p className="text-3xl font-semibold text-primary-text">
               {balanceFormatted}
             </p>
             <p className="text-sm text-muted-text mt-3">{t.subscription.walletSubtitle}</p>
           </Card>
        </div>

        {/* Promotions area */}
        <div className="flex flex-col gap-4">
           <h2 className="text-sm font-semibold tracking-wide text-muted-text uppercase">{t.promotions.title}</h2>
           {promotionsError ? (
              <Card className="p-6"><p className="text-sm text-danger-red">{t.promotions.loadError}</p></Card>
            ) : promotions === null ? (
              <Card className="flex justify-center py-8"><Spinner size={24} /></Card>
            ) : promotions.length === 0 ? (
              <Card className="p-6"><p className="text-sm text-muted-text">Nenhuma promoção disponível no momento.</p></Card>
            ) : (
              <div className="flex flex-col gap-3">
                {promotions.map((promo) => {
                  const { title, description } = getPromotionStrings(t, promo);
                  const creditLine = t.promotions.creditAmount.replace(
                    '{amount}',
                    formatCredits(promo.creditAmount)
                  );
                  return (
                    <Card
                      key={promo.id}
                      clickable
                      onClick={() => setSelectedPromotion(promo)}
                      className="p-5 flex flex-col justify-between gap-3 relative overflow-visible"
                    >
                      {promo.eligible && !promo.claimed && !promoDismissed && (
                        <div className="absolute bottom-[105%] left-1/2 -translate-x-1/2 mb-2 w-56 p-3 rounded-2xl bg-gradient-to-br from-accent-blue/10 to-surface border border-accent-blue/30 backdrop-blur-xl shadow-[0_8px_30px_rgb(0,0,0,0.3)] animate-[fade-in-up_0.4s_ease-out_forwards] z-10" onClick={(e) => e.stopPropagation()}>
                          <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-3 h-3 bg-surface border-b border-r border-accent-blue/30 transform rotate-45" />
                          <div className="flex items-start justify-between gap-3 relative">
                            <div className="w-6 h-6 rounded-full bg-accent-blue/20 flex items-center justify-center text-accent-blue shrink-0 mt-0.5">
                              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                              </svg>
                            </div>
                            <span className="text-[13px] font-medium text-primary-text leading-snug">{t.promotions.claimTooltipCard}</span>
                            <button onClick={handleDismissPromo} className="shrink-0 text-muted-text hover:text-primary-text transition-colors mt-1 cursor-pointer" aria-label="Close">
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M18 6L6 18M6 6l12 12" />
                              </svg>
                            </button>
                          </div>
                        </div>
                      )}
                      <div>
                         <div className="flex items-center gap-2 lg:gap-3 mb-1.5 flex-wrap">
                           <h3 className="text-[15px] font-medium text-primary-text leading-tight">{title}</h3>
                           {promo.claimed && (
                             <Badge variant="green" className="py-0 px-2 text-[10px] uppercase tracking-wider font-semibold">{t.promotions.claimed}</Badge>
                           )}
                         </div>
                         <p className="text-[13px] font-semibold text-accent-blue">{creditLine}</p>
                         <p className="text-sm text-muted-text mt-2 leading-relaxed">{description}</p>
                      </div>
                    </Card>
                  );
                })}
              </div>
            )}
        </div>
      </div>

      <PaymentModal
        open={paymentOpen}
        onClose={() => setPaymentOpen(false)}
        balance={user.balance}
        onSuccess={refetch}
      />

      <PromotionDetailModal
        open={selectedPromotion !== null}
        promotion={selectedPromotion}
        onClose={() => setSelectedPromotion(null)}
        onClaimed={handlePromotionClaimed}
      />
    </div>
  );
}
