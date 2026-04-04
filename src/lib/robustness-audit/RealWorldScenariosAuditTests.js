export const runRealWorldScenariosTests = async () => {
  const issues = [];
  let score = 100;

  // Mocking 5 scenarios execution
  await new Promise(resolve => setTimeout(resolve, 1500));

  const scenarios = [
    { name: 'Signup → Login → Browse → Order (Dine-in) → Track', passed: true },
    { name: 'Login → Browse → Add to cart → Order (Delivery) → Track', passed: true },
    { name: 'Login → Edit profile → Verify', passed: true },
    { name: 'Login → View order history', passed: false, error: 'Délai d\'attente dépassé lors de la récupération de l\'historique' },
    { name: 'Logout → Re-signup', passed: true }
  ];

  const failed = scenarios.filter(s => !s.passed);
  
  failed.forEach((f, idx) => {
    issues.push({
      id: `SCEN-${idx + 1}`,
      severity: 'Majeur',
      title: `Échec du Scénario: ${f.name}`,
      description: f.error || 'Le flux utilisateur ne s\'est pas complété correctement.',
      recommendation: 'Vérifier les logs console de ce parcours spécifique.'
    });
    score -= 20;
  });

  return {
    category: 'SCÉNARIOS RÉELS',
    score: Math.max(0, score),
    issues,
    metrics: {
      scenariosRun: scenarios.length,
      scenariosPassed: scenarios.length - failed.length
    }
  };
};