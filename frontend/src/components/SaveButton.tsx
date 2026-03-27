/**
 * SaveButton — requires Clerk production keys to function.
 * Returns null until Clerk is configured for the production domain.
 * TODO: Re-enable when Clerk production keys are set up.
 */
interface Props {
  ideaId: string;
  initialSaved: boolean;
  initialRating: number | null;
}

export default function SaveButton(_props: Props) {
  return null;
}
