interface ProgressIndicatorProps {
  currentStep: number;
}

export default function ProgressIndicator({ currentStep }: ProgressIndicatorProps) {
  const steps = [
    { number: 1, title: "Upload Documents" },
    { number: 2, title: "Process & Index" },
    { number: 3, title: "Ask Questions" }
  ];

  return (
    <div className="mb-8">
      <div className="flex items-center justify-center space-x-4 mb-6">
        {steps.map((step, index) => (
          <div key={step.number} className="flex items-center">
            <div className="flex items-center">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                currentStep >= step.number 
                  ? 'bg-primary text-white' 
                  : 'bg-slate-200 text-slate-500'
              }`}>
                {step.number}
              </div>
              <span className={`ml-2 text-sm font-medium ${
                currentStep >= step.number ? 'text-slate-900' : 'text-slate-500'
              }`}>
                {step.title}
              </span>
            </div>
            {index < steps.length - 1 && (
              <div className="w-16 h-0.5 bg-slate-200 mx-4" />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
