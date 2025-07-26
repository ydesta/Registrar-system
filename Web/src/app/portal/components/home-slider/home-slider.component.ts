import { Component, OnInit, OnDestroy } from '@angular/core';

interface SlideItem {
  imageUrl: string;
  title: string;
  description: string;
  primaryButton?: string;
  secondaryButton?: string;
  imageError?: boolean;
}

@Component({
  selector: 'app-home-slider',
  templateUrl: './home-slider.component.html',
  styleUrls: ['./home-slider.component.scss']
})
export class HomeSliderComponent implements OnInit, OnDestroy {
  currentIndex = 0;
  autoPlayInterval: any;
  isTransitioning = false;

  slides: SlideItem[] = [
    {
      imageUrl: './assets/images/slider/1.jpg',
      title: 'Excellence in Computer Science & Technology Education',
      description: 'Empowering future tech leaders through innovative learning and cutting-edge curriculum',
      primaryButton: 'Explore Programs',
      secondaryButton: 'Learn More'
    },
    // {
    //   imageUrl: './assets/images/slider/5.png',
    //   title: 'Industry-Ready Education',
    //   description: 'Bridging academic excellence with practical industry experience',
    //   primaryButton: 'Our Courses',
    //   secondaryButton: 'Apply Now'
    // },
    // {
    //   imageUrl: './assets/images/slider/award.png',
    //   title: 'Research & Innovation',
    //   description: 'Leading the way in computer science research and technological advancement',
    //   primaryButton: 'Research Areas',
    //   secondaryButton: 'Join Us'
    // }
  ];

  ngOnInit() {
    this.startAutoPlay();
    this.preloadImages();
  }

  ngOnDestroy() {
    this.stopAutoPlay();
  }

  preloadImages() {
    this.slides.forEach((slide, index) => {
      const img = new Image();
      img.onload = () => {
        slide.imageError = false;
      };
      img.onerror = () => {
        slide.imageError = true;
      };
      img.src = slide.imageUrl;
    });
  }

  startAutoPlay() {
    this.autoPlayInterval = setInterval(() => {
      if (!this.isTransitioning) {
        this.nextSlide();
      }
    }, 4000);
  }

  stopAutoPlay() {
    if (this.autoPlayInterval) {
      clearInterval(this.autoPlayInterval);
    }
  }

  nextSlide() {
    if (this.isTransitioning) return;
    
    this.isTransitioning = true;
    this.currentIndex = (this.currentIndex + 1) % this.slides.length;
    
    setTimeout(() => {
      this.isTransitioning = false;
    }, 500);
  }

  prevSlide() {
    if (this.isTransitioning) return;
    
    this.isTransitioning = true;
    this.currentIndex = (this.currentIndex - 1 + this.slides.length) % this.slides.length;
    
    setTimeout(() => {
      this.isTransitioning = false;
    }, 500);
  }

  setCurrentSlide(index: number) {
    if (this.isTransitioning) return;
    
    this.isTransitioning = true;
    this.currentIndex = index;
    
    setTimeout(() => {
      this.isTransitioning = false;
    }, 500);
  }

  onMouseEnter() {
    this.stopAutoPlay();
  }

  onMouseLeave() {
    this.startAutoPlay();
  }

  onSlideClick(buttonType: string, index: number) {
  }
} 