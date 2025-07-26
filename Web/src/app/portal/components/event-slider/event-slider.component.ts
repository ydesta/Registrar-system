import { Component, OnInit } from '@angular/core';

interface EventImage {
  url: string;
  title: string;
  description: string;
}

@Component({
  selector: 'app-event-slider',
  templateUrl: './event-slider.component.html',
  styleUrls: ['./event-slider.component.scss']
})
export class EventSliderComponent implements OnInit {
  currentIndex = 0;
  autoPlayInterval: any;

  eventImages: EventImage[] = [
    // {
    //   url: 'assets/images/1.jpg',
    //   title: 'Campus Life',
    //   description: 'Experience the vibrant atmosphere of our campus community'
    // },
    // {
    //   url: 'assets/images/2.png',
    //   title: 'Student Activities',
    //   description: 'Engaging in various academic and extracurricular activities'
    // },
    // {
    //   url: 'assets/images/3.png',
    //   title: 'Learning Environment',
    //   description: 'Modern facilities and interactive learning spaces'
    // },
    // {
    //   url: 'assets/images/4.png',
    //   title: 'Technology Hub',
    //   description: 'State-of-the-art technology and computing facilities'
    // },
    {
      url: 'assets/images/5.png',
      title: 'Research & Innovation',
      description: 'Students working on innovative research projects'
    },
    // {
    //   url: 'assets/images/6.png',
    //   title: 'Student Success',
    //   description: 'Celebrating achievements and academic excellence'
    // },
    // {
    //   url: 'assets/images/7.png',
    //   title: 'Student Success',
    //   description: 'Celebrating achievements and academic excellence'
    // }
  ];

  ngOnInit() {
    this.startAutoPlay();
  }

  ngOnDestroy() {
    this.stopAutoPlay();
  }

  startAutoPlay() {
    this.autoPlayInterval = setInterval(() => {
      this.nextSlide();
    }, 4000); // Changed to 4 seconds for better viewing experience
  }

  stopAutoPlay() {
    if (this.autoPlayInterval) {
      clearInterval(this.autoPlayInterval);
    }
  }

  nextSlide() {
    this.currentIndex = (this.currentIndex + 1) % this.eventImages.length;
  }

  prevSlide() {
    this.currentIndex = (this.currentIndex - 1 + this.eventImages.length) % this.eventImages.length;
  }

  setCurrentSlide(index: number) {
    this.currentIndex = index;
    this.stopAutoPlay(); // Stop autoplay when user interacts
    this.startAutoPlay(); // Restart autoplay
  }

  // Pause autoplay when mouse enters the slider
  onMouseEnter() {
    this.stopAutoPlay();
  }

  // Resume autoplay when mouse leaves the slider
  onMouseLeave() {
    this.startAutoPlay();
  }
}
