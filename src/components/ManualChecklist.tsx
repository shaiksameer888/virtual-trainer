export function ManualChecklist() {
  return (
    <section className="panel checklist">
      <div className="panel-heading">
        <span>Manual QA</span>
      </div>
      <ul>
        <li>Grant and deny camera permission.</li>
        <li>Step partly out of frame and verify calibration warning.</li>
        <li>Perform one shallow squat and one full squat.</li>
        <li>Move too quickly and listen for tempo feedback.</li>
        <li>Switch exercises and confirm counters reset.</li>
      </ul>
    </section>
  );
}
