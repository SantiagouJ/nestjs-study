import type { Track } from "@/lib/types";
import { nextTrack } from "@/data/next/track";
import { track as nestTrack } from "@/data/track";

/** Catálogo de tracks: NestJS y Next.js conectado a backend. */
export const tracks: Track[] = [nestTrack, nextTrack];

export const allExercises = tracks.flatMap((item) =>
  item.topics.flatMap((topic) =>
    topic.exercises.map((exercise) => ({
      ...exercise,
      topicTitle: topic.title,
      trackId: item.id,
      trackTitle: item.title,
    })),
  ),
);

export function getExercise(exerciseId: string) {
  return allExercises.find((exercise) => exercise.id === exerciseId);
}

export function getTopic(topicId: string) {
  for (const item of tracks) {
    const topic = item.topics.find((entry) => entry.id === topicId);
    if (topic) return topic;
  }
}

export function getTrackByTopic(topicId: string) {
  return tracks.find((item) =>
    item.topics.some((topic) => topic.id === topicId),
  );
}

export const exerciseCount = allExercises.length;
