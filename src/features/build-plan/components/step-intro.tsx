type StepIntroProps = {
  title: string;
  description?: string;
};

export function StepIntro({ title, description }: StepIntroProps) {
  return (
    <div className="mb-8">
      <h1 data-step-heading tabIndex={-1} className="display-heading max-w-[15ch] text-4xl outline-none sm:text-5xl">
        {title}
      </h1>
      {description ? <p className="body-copy mt-4 max-w-xl text-lg">{description}</p> : null}
    </div>
  );
}
