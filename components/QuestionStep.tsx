'use client'

import type { QuestionCategory } from '@/configs/questions'
import { useTranslations } from 'next-intl'
import { QUESTION_CATEGORIES } from '@/configs/questions'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'

/** 第一步:選擇問題類別、寫下困惑 */

interface Props {
  question: string
  category: QuestionCategory
  onQuestionChange: (value: string) => void
  onCategoryChange: (value: QuestionCategory) => void
  onNext: () => void
}

export default function QuestionStep({
  question,
  category,
  onQuestionChange,
  onCategoryChange,
  onNext,
}: Props) {
  const t = useTranslations('question')

  return (
    <Card className="animate-fade-up">
      <CardHeader className="p-6 pb-5 sm:p-8 sm:pb-5">
        <CardTitle>{t('title')}</CardTitle>
        <CardDescription>{t('desc')}</CardDescription>
      </CardHeader>

      <CardContent className="p-6 pt-0 sm:p-8 sm:pt-0">
        {/* 問題類別 */}
        <ToggleGroup
          type="single"
          value={category}
          onValueChange={(value) => {
            if (QUESTION_CATEGORIES.includes(value as QuestionCategory)) {
              onCategoryChange(value as QuestionCategory)
            }
          }}
          className="mb-4"
        >
          {QUESTION_CATEGORIES.map((c) => (
            <ToggleGroupItem key={c} value={c} className="rounded-full">
              {t(`categories.${c}`)}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>

        <Textarea
          value={question}
          onChange={(e) => onQuestionChange(e.target.value)}
          maxLength={500}
          rows={4}
          placeholder={t(`placeholders.${category}`)}
          className="resize-none p-4"
        />
        <div className="mt-1 text-right text-xs text-stone-400">
          {question.length}
          /500
        </div>

        <Button
          type="button"
          onClick={onNext}
          disabled={!question.trim()}
          variant="brand"
          className="mt-4 w-full"
        >
          {t('next')}
        </Button>
      </CardContent>
    </Card>
  )
}
