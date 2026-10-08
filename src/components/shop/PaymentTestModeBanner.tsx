const clientToken = import.meta.env['VITE_PAYMENTS_CLIENT_TOKEN'];

export function PaymentTestModeBanner() {
  if (!clientToken) {
    return (
      <div className="w-full bg-red-100 border-b border-red-300 px-4 py-2 text-center text-sm text-red-800">
        Productie-betalingen zijn nog niet ingesteld. Voltooi de live-gang van je betalingen in Lovable om echte betalingen te accepteren.
      </div>
    );
  }
  if (clientToken.startsWith("pk_test_")) {
    return (
      <div className="w-full bg-orange-100 border-b border-orange-300 px-4 py-2 text-center text-sm text-orange-800">
        Betalingen in de preview lopen in testmodus.{" "}
        <a
          href="https://docs.lovable.dev/features/payments#test-and-live-environments"
          target="_blank"
          rel="noopener noreferrer"
          className="font-medium underline"
        >
          Lees meer
        </a>
      </div>
    );
  }
  return null;
}
