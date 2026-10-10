CREATE TABLE public.provider_usage (
    subject_hash varchar(64) NOT NULL,
    category varchar(20) NOT NULL,
    window_at timestamptz NOT NULL,
    requests integer NOT NULL CHECK (requests > 0),
    PRIMARY KEY(subject_hash,category,window_at)
);
ALTER TABLE public.provider_usage ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.provider_usage FROM PUBLIC;
